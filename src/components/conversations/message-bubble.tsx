import { CircleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { INTENT_LABEL, type Message } from "@/lib/api/types"
import { formatClock, formatDuration, truncate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * One entry of the message timeline. Distinction is never colour-only:
 * every bubble carries a sender label, a timestamp, and, for assistant
 * turns, model + latency metadata in mono type. System events render as
 * centered rule lines; failures as destructive blocks with retry.
 */
export function MessageBubble({
  message,
  onRetry,
  retryPending,
}: {
  message: Message
  onRetry?: (message: Message) => void
  retryPending?: boolean
}) {
  if (message.kind === "system") {
    const failed =
      message.delivery === "failed" || message.delivery === "unsupported"
    return (
      <li className="flex items-center gap-3" role="note">
        <span aria-hidden="true" className="bg-border h-px flex-1" />
        <span
          className={cn(
            "text-xs",
            failed ? "text-destructive font-medium" : "text-muted-foreground",
          )}
        >
          {failed ? (
            <CircleAlertIcon
              aria-hidden="true"
              className="mr-1 inline size-3 align-[-2px]"
            />
          ) : null}
          {message.body}
        </span>
        <span aria-hidden="true" className="bg-border h-px flex-1" />
      </li>
    )
  }

  const inbound = message.direction === "inbound"
  const operator = message.author.type === "operator"

  return (
    <li
      className={cn("flex", inbound ? "justify-start" : "justify-end")}
      data-direction={message.direction}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]",
          inbound ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            inbound && "bg-muted text-foreground",
            message.author.type === "assistant" &&
              "bg-primary-soft text-primary-soft-foreground",
            operator &&
              (message.delivery === "failed"
                ? "bg-destructive-soft text-destructive-soft-foreground"
                : "bg-primary text-primary-foreground"),
          )}
        >
          <p className="text-pretty break-words whitespace-pre-wrap">
            {message.body}
          </p>
        </div>
        <div
          className={cn(
            "text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]",
            inbound ? "self-start" : "self-end text-right",
          )}
        >
          <span className="font-medium">{message.author.name}</span>
          <time dateTime={message.createdAt}>
            {formatClock(message.createdAt)}
          </time>
          <span aria-hidden="true">·</span>
          {message.intent ? <span>{INTENT_LABEL[message.intent]}</span> : null}
          {message.llmModel ? (
            <span title="Model that generated this reply">
              {message.llmModel}
            </span>
          ) : null}
          {message.latencyMs ? (
            <span title="Time to produce this reply">
              {formatDuration(message.latencyMs)}
            </span>
          ) : null}
          <DeliveryNote message={message} />
          {message.delivery === "failed" && onRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(message)}
              disabled={retryPending}
            >
              {retryPending ? "Retrying…" : "Retry send"}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function DeliveryNote({ message }: { message: Message }) {
  if (message.delivery === "pending") {
    return <span className="text-warning">Sending… still in this console</span>
  }
  if (message.delivery === "failed") {
    return (
      <span className="text-destructive">
        <span className="sr-only">Send failed: </span>
        {truncate(
          message.failureNote ?? "The send did not leave the console.",
          48,
        )}
      </span>
    )
  }
  if (message.delivery === "delivered") {
    return <span>Delivered</span>
  }
  return null
}
