import { useEffect, useRef } from "react"

import { EmptyState } from "@/components/app"
import { MessageBubble } from "./message-bubble"
import { type Message } from "@/lib/api/types"
import { formatDay } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Chronological message list with deterministic day separators (fixed
 * locale + timezone, so SSR and hydration agree) and auto-scroll to the
 * newest entry. Announced as a log region.
 */
export function MessageTimeline({
  messages,
  onRetry,
  retryPending,
  className,
}: {
  messages: Message[]
  onRetry?: (message: Message) => void
  retryPending?: boolean
  className?: string
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="When the webhook logs the first turn, the thread appears here."
      />
    )
  }

  return (
    <ol
      aria-label="Message timeline"
      className={cn("flex flex-col gap-3 overflow-y-auto", className)}
    >
      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const dayChanged =
          !previous ||
          formatDay(previous.createdAt) !== formatDay(message.createdAt)
        return (
          <MessageGroup
            key={message.id}
            message={message}
            dayChanged={dayChanged}
            onRetry={onRetry}
            retryPending={retryPending}
          />
        )
      })}
      <div ref={endRef} />
    </ol>
  )
}

function MessageGroup({
  message,
  dayChanged,
  onRetry,
  retryPending,
}: {
  message: Message
  dayChanged: boolean
  onRetry?: (message: Message) => void
  retryPending?: boolean
}) {
  return (
    <>
      {dayChanged ? (
        <li className="my-1 flex items-center gap-3" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">
            {formatDay(message.createdAt)}
          </span>
          <span className="bg-border h-px flex-1" />
        </li>
      ) : null}
      <MessageBubble
        message={message}
        onRetry={onRetry}
        retryPending={retryPending}
      />
    </>
  )
}
