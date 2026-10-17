import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { InboxIcon } from "lucide-react"
import { ConversationFilters } from "@/components/conversations/conversation-filters"
import { ConversationList } from "@/components/conversations/conversation-list"
import { ConversationDetail } from "@/components/conversations/conversation-detail"
import { useConversationList } from "@/components/conversations/use-conversation-list"
import {
  DemoDataNote,
  EmptyState,
  PageHeader,
  PageSection,
} from "@/components/app"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  DEFAULT_FILTERS,
  type ConversationFilters as Filters,
} from "@/lib/api/types"
import { MOCK_NOW } from "@/lib/api/mock-data"

export const Route = createFileRoute("/conversations")({
  validateSearch: (search: Record<string, unknown>): { c?: string } => ({
    c:
      typeof search.c === "string" && search.c.length > 0
        ? search.c
        : undefined,
  }),
  component: ConversationsPage,
})

function ConversationsPage() {
  const search = Route.useSearch()
  const selectedId = search.c

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const debouncedSearch = useDebouncedValue(filters.search, 220)
  const effectiveFilters = useMemo<Filters>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )

  const list = useConversationList(effectiveFilters)
  // Fixture snapshot time; the HTTP adapter replaces this with a response
  // header later.
  const generatedAt = MOCK_NOW

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Conversations"
        description="Follow every chat, read the thread with delivery metadata, and draft replies. Selection lives in the URL so a chat can be shared or bookmarked."
      />

      <DemoDataNote generatedAt={generatedAt} />

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <PageSection
          id="conversations-list"
          className={
            selectedId !== undefined
              ? "hidden min-h-0 flex-col lg:flex"
              : "flex min-h-0 flex-col"
          }
        >
          <ConversationFilters
            filters={filters}
            onChange={setFilters}
            resultCount={list.items.length}
            totalCount={list.total}
          />
          <ConversationList
            items={list.items}
            total={list.total}
            loading={list.loading}
            loadingMore={list.loadingMore}
            refreshing={list.refreshing}
            error={list.error}
            hasMore={list.hasMore}
            selectedId={selectedId}
            generatedAt={generatedAt}
            onLoadMore={list.loadMore}
            onRetry={list.refetch}
          />
        </PageSection>

        <PageSection
          id="conversations-detail"
          className={
            selectedId !== undefined
              ? "flex min-h-0 flex-col"
              : "hidden min-h-0 flex-col lg:flex"
          }
        >
          {selectedId === undefined ? (
            <div className="hidden lg:block">
              <EmptyState
                icon={InboxIcon}
                title="Select a conversation"
                description="Pick a chat on the left to read the full thread, check delivery metadata, and draft a reply."
              />
            </div>
          ) : (
            <ConversationDetail
              conversationId={selectedId}
              onPatchSummary={list.patchLocal}
              generatedAt={generatedAt}
            />
          )}
        </PageSection>
      </div>
    </div>
  )
}
