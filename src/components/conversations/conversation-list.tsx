import { Link } from "@tanstack/react-router"
import { CircleAlertIcon, InboxIcon } from "lucide-react"

import { EmptyState, ErrorState, StatusBadge } from "@/components/app"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  HANDLING_LABEL,
  INTENT_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ConversationSummary,
} from "@/lib/api/types"
import { maskPhone, relativeAgo, truncate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * The scrollable conversation list. Each row is a link carrying `?c=<id>`
 * so a conversation can be deep-linked; the active row is marked with
 * `aria-current` and a quiet highlight instead of colour alone.
 */
export function ConversationList({
  items,
  total,
  loading,
  loadingMore,
  refreshing,
  error,
  hasMore,
  selectedId,
  generatedAt,
  onLoadMore,
  onRetry,
  className,
}: {
  items: ConversationSummary[]
  total: number
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  error: string | null
  hasMore: boolean
  selectedId: string | undefined
  generatedAt: string
  onLoadMore: () => void
  onRetry: () => void
  className?: string
}) {
  if (error && items.length === 0) {
    return (
      <ErrorState
        title="Conversations could not be loaded"
        description={error}
        onRetry={onRetry}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No conversations match these filters"
        description="Try widening the date window or clearing one of the filters. New enquiries appear here the moment the webhook logs a turn."
      />
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {refreshing ? (
        <p className="sr-only" aria-live="polite">
          Refreshing the conversation list.
        </p>
      ) : null}
      <ul className="flex flex-col" aria-label="Conversations">
        {items.map((item) => (
          <li key={item.id}>
            <ConversationRow
              conversation={item}
              active={item.id === selectedId}
              generatedAt={generatedAt}
            />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="border-border border-t p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-label={`Load more conversations; ${total - items.length} not shown yet`}
          >
            {loadingMore
              ? "Loading…"
              : `Load more (${total - items.length} hidden)`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ConversationRow({
  conversation,
  active,
  generatedAt,
}: {
  conversation: ConversationSummary
  active: boolean
  generatedAt: string
}) {
  return (
    <Link
      to="/conversations"
      search={(previous) => ({ ...previous, c: conversation.id })}
      aria-current={active ? "true" : undefined}
      className={cn(
        "hover:bg-accent/50 focus-visible:ring-ring relative flex flex-col gap-1.5 border-b px-4 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
        active && "bg-accent",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{conversation.contact.initials}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {conversation.contact.displayName}
              </span>
              {conversation.unreadCount > 0 ? (
                <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none">
                  {conversation.unreadCount}
                  <span className="sr-only"> unread messages</span>
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground truncate font-mono text-xs">
              {maskPhone(conversation.contact.phone)}
            </span>
          </span>
        </span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums">
          {relativeAgo(conversation.lastActivityAt, generatedAt)}
        </span>
      </span>
      <span className="text-muted-foreground flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs">
          <span className="sr-only">Last message: </span>
          {truncate(conversation.lastMessagePreview, 64)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {conversation.hasError ? (
            <>
              <CircleAlertIcon
                aria-hidden="true"
                className="text-destructive size-3.5"
              />
              <span className="sr-only">Has delivery errors</span>
            </>
          ) : null}
          <StatusBadge tone={STATUS_TONE[conversation.status]}>
            {STATUS_LABEL[conversation.status]}
          </StatusBadge>
        </span>
      </span>
      <span className="sr-only">
        Enquiry type {INTENT_LABEL[conversation.intent]}; handling:{" "}
        {HANDLING_LABEL[conversation.handlingMode]}
      </span>
    </Link>
  )
}
