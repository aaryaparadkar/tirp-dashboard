import { useCallback, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { ArrowLeftIcon, BookOpenTextIcon, ReceiptTextIcon } from "lucide-react"

import { ConversationActions } from "@/components/conversations/conversation-actions"
import { MessageTimeline } from "@/components/conversations/message-timeline"
import { ReplyComposer } from "@/components/conversations/reply-composer"
import { ErrorState, StatusBadge } from "@/components/app"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboardQuery } from "@/hooks/use-dashboard-query"
import { getDashboardAdapter } from "@/lib/api/dashboard"
import {
  HANDLING_LABEL,
  INTENT_LABEL,
  LANGUAGE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ConversationDetail,
  type ConversationSummary,
  type Message,
} from "@/lib/api/types"
import { formatDateTime, maskPhone, relativeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Right-hand workspace pane. Owns optimistic send state for the selected
 * conversation; the list reflects selected-badge changes through
 * `onPatchSummary`.
 */
export function ConversationDetail({
  conversationId,
  onPatchSummary,
  generatedAt,
}: {
  /** Snapshot row id; the detail query loads the thread. */
  conversationId: string
  onPatchSummary: (
    conversationId: string,
    patch: Partial<ConversationSummary>,
  ) => void
  generatedAt: string
}) {
  return (
    <DetailLoader
      conversationId={conversationId}
      onPatchSummary={onPatchSummary}
      generatedAt={generatedAt}
    />
  )
}

function DetailLoader({
  conversationId,
  onPatchSummary,
  generatedAt,
}: {
  conversationId: string
  onPatchSummary: (
    conversationId: string,
    patch: Partial<ConversationSummary>,
  ) => void
  generatedAt: string
}) {
  const query = useDashboardQuery<ConversationDetail>(
    () => getDashboardAdapter().getConversation(conversationId),
    [conversationId],
  )

  if (query.loading) {
    return (
      <div aria-hidden="true" aria-busy="true" className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-3/4 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorState
          title="The conversation could not be loaded"
          description={query.error}
          onRetry={query.refetch}
        />
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/conversations">
            <ArrowLeftIcon aria-hidden="true" />
            Back to all conversations
          </Link>
        </Button>
      </div>
    )
  }

  if (!query.data) return null

  return (
    <ConversationDetailBody
      key={conversationId}
      detail={query.data}
      onPatchSummary={onPatchSummary}
      generatedAt={generatedAt}
    />
  )
}

function ConversationDetailBody({
  detail,
  onPatchSummary,
  generatedAt,
  className,
}: {
  detail: ConversationDetail
  onPatchSummary: (
    conversationId: string,
    patch: Partial<ConversationSummary>,
  ) => void
  generatedAt: string
  className?: string
}) {
  const [unreadOverride, setUnreadOverride] = useState<number | null>(null)
  const summary: ConversationSummary = {
    ...detail.summary,
    unreadCount: unreadOverride ?? detail.summary.unreadCount,
  }
  const [pending, setPending] = useState<Message[]>([])
  const [announcement, setAnnouncement] = useState("")
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)

  const allMessages = [...detail.messages, ...pending]

  const send = useCallback(
    async (body: string, existingTag?: string) => {
      if (busyRef.current) return
      busyRef.current = true
      setBusy(true)
      const clientTag =
        existingTag ??
        `client-${summary.id}-${detail.messages.length + pending.length + 1}`
      if (!existingTag) {
        setPending((previous) => [
          ...previous,
          {
            id: clientTag,
            conversationId: summary.id,
            direction: "outbound",
            kind: "message",
            author: { type: "operator", name: "Operator" },
            body,
            createdAt: detail.summary.generatedAt,
            delivery: "pending",
          },
        ])
        setAnnouncement(
          "Sending the reply. It stays in this console until the backend accepts it.",
        )
      } else {
        setPending((previous) =>
          previous.map((message) =>
            message.id === existingTag
              ? { ...message, delivery: "pending" as const }
              : message,
          ),
        )
      }
      try {
        const { message, error } = await getDashboardAdapter().sendMessage({
          conversationId: summary.id,
          body,
          clientTag,
        })
        setPending((previous) =>
          previous.map((draft) => (draft.id === clientTag ? message : draft)),
        )
        if (error) {
          setAnnouncement(
            `Send failed: ${error.title}. Nothing left the console.`,
          )
          toast.error(error.title, { description: error.message })
        } else {
          setAnnouncement("Reply sent.")
        }
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    },
    [
      detail.messages.length,
      detail.summary.generatedAt,
      pending.length,
      summary.id,
    ],
  )

  const handleToggleUnread = useCallback(
    (unread: boolean) => {
      setUnreadOverride(unread ? 1 : 0)
      onPatchSummary(summary.id, { unreadCount: unread ? 1 : 0 })
    },
    [onPatchSummary, summary.id],
  )

  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      <DetailHeader
        summary={summary}
        generatedAt={generatedAt}
        onToggleUnread={handleToggleUnread}
      />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Tabs
        defaultValue="timeline"
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <TabsList>
          <TabsTrigger value="timeline">
            <ReceiptTextIcon aria-hidden="true" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="details">
            <BookOpenTextIcon aria-hidden="true" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="timeline"
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <div className="max-h-[52vh] min-h-40 flex-1 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-30rem)]">
                <MessageTimeline
                  messages={allMessages}
                  onRetry={(message) => void send(message.body, message.id)}
                  retryPending={busy}
                />
              </div>
              <Separator />
              <ReplyComposer onSend={(body) => send(body)} disabled={busy} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <DetailFacts summary={summary} detail={detail} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DetailHeader({
  summary,
  generatedAt,
  onToggleUnread,
}: {
  summary: ConversationSummary
  generatedAt: string
  onToggleUnread: (unread: boolean) => void
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="lg:hidden">
            <Link
              to="/conversations"
              aria-label="Back to the conversation list"
              onClick={() => {
                if ("scrollTo" in window) window.scrollTo({ top: 0 })
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Link>
          </Button>
          <Avatar className="size-10 shrink-0">
            <AvatarFallback>{summary.contact.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {summary.contact.displayName}
            </h2>
            <p className="text-muted-foreground font-mono text-xs">
              {maskPhone(summary.contact.phone)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={STATUS_TONE[summary.status]}>
                {STATUS_LABEL[summary.status]}
              </StatusBadge>
              <Badge variant="outline">{INTENT_LABEL[summary.intent]}</Badge>
              <Badge variant="outline">
                {LANGUAGE_LABEL[summary.language]}
              </Badge>
              <Badge variant="outline">
                {HANDLING_LABEL[summary.handlingMode]}
              </Badge>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                last activity {relativeAgo(summary.lastActivityAt, generatedAt)}
              </span>
            </div>
          </div>
        </div>
        <ConversationActions
          conversation={summary}
          onToggleUnread={onToggleUnread}
        />
      </CardContent>
    </Card>
  )
}

function DetailFacts({
  summary,
  detail,
}: {
  summary: ConversationSummary
  detail: ConversationDetail
}) {
  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: "Conversation",
      value: <span className="font-mono">{summary.id}</span>,
    },
    {
      label: "Contact ID",
      value: <span className="font-mono">{summary.contact.id}</span>,
    },
    {
      label: "Started",
      value: `${formatDateTime(summary.startedAt)} AEDT`,
    },
    {
      label: "Last activity",
      value: `${formatDateTime(summary.lastActivityAt)} AEDT`,
    },
    { label: "Messages", value: String(summary.messageCount) },
    { label: "Language", value: LANGUAGE_LABEL[summary.language] },
    { label: "Status", value: STATUS_LABEL[summary.status] },
    {
      label: "Handling",
      value: HANDLING_LABEL[summary.handlingMode],
    },
    {
      label: "Delivery errors",
      value: summary.hasError ? "Yes — see the timeline" : "None recorded",
    },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{fact.label}</dt>
              <dd className="text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <Separator />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Session notes</p>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-4 text-sm">
            {detail.summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        {detail.recentSources.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                Knowledge-base sources cited
              </p>
              <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                {detail.recentSources.map((source) => (
                  <li key={source.id} className="flex flex-col">
                    <span>{source.title}</span>
                    <span className="font-mono text-xs">{source.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
