import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  CONVERSATION_PAGE_SIZE,
  getDashboardAdapter,
} from "@/lib/api/dashboard"
import { MOCK_NOW } from "@/lib/api/mock-data"
import {
  type ConversationFilters,
  type ConversationSummary,
} from "@/lib/api/types"

export interface ConversationList {
  items: ConversationSummary[]
  total: number
  /** First load for the current filter key. */
  loading: boolean
  /** Appending a further page. */
  loadingMore: boolean
  /** Refetching with newer data while the current page stays visible. */
  refreshing: boolean
  error: string | null
  hasMore: boolean
  /** Snapshot time from the latest response; drives relative labels. */
  generatedAt: string
  loadMore: () => void
  refetch: () => void
  /** Quiet background sync of the loaded rows (no loading state, no reset). */
  sync: () => void
  /** Ids that just arrived or changed in a sync; rows highlight briefly. */
  freshIds: ReadonlySet<string>
  /** Local-only badge/state fixups so the list keeps up with the detail pane. */
  patchLocal: (
    conversationId: string,
    patch: Partial<ConversationSummary>,
  ) => void
}

/**
 * Accumulating list loader: page 1 refetches from scratch whenever the
 * filter key changes, "Load more" appends further pages. All reads go
 * through the dashboard adapter — never from presentational components.
 */
export function useConversationList(
  filters: ConversationFilters,
  pageSize: number = CONVERSATION_PAGE_SIZE,
  opts: {
    /** Called with conversations that appeared since the last sync. */
    onNew?: (fresh: ConversationSummary[]) => void
  } = {},
): ConversationList {
  const [items, setItems] = useState<ConversationSummary[]>([])
  const [total, setTotal] = useState(0)
  const [generatedAt, setGeneratedAt] = useState<string>(MOCK_NOW)
  const [state, setState] = useState<"initial" | "ready" | "error">("initial")
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set())
  const itemsRef = useRef<ConversationSummary[]>([])
  itemsRef.current = items
  const onNewRef = useRef(opts.onNew)
  onNewRef.current = opts.onNew
  const syncing = useRef(false)

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const pageRef = useRef(1)
  const localKey = useRef<string>(filterKey)
  // When the filter key changes mid-flight, keep the freshly resolved
  // request from writing stale items into the new view.
  const pendingKey = useRef<string>(filterKey)

  const run = useCallback(
    async (mode: "replace" | "more", signal?: AbortSignal) => {
      const key = localKey.current
      const page = mode === "replace" ? 1 : pageRef.current + 1
      try {
        const result = await getDashboardAdapter().listConversations(
          filtersRef.current,
          { page, pageSize },
          signal,
        )
        if (key !== pendingKey.current || signal?.aborted) return
        pageRef.current = page
        setTotal(result.total)
        setGeneratedAt(result.generatedAt)
        setItems((previous) =>
          mode === "replace"
            ? result.data
            : [
                ...previous,
                ...result.data.filter(
                  (fresh) => !previous.some((item) => item.id === fresh.id),
                ),
              ],
        )
        setState("ready")
        setError(null)
      } catch (thrown) {
        if (key !== pendingKey.current || signal?.aborted) return
        setError(
          thrown instanceof Error
            ? thrown.message
            : "Conversations could not be loaded.",
        )
        setState("error")
      }
    },
    [pageSize],
  )

  useEffect(() => {
    if (filterKey === localKey.current && state !== "error" && items.length > 0)
      return
    const controller = new AbortController()
    localKey.current = filterKey
    pendingKey.current = filterKey
    pageRef.current = 1
    setItems([])
    setTotal(0)
    setState("initial")
    void run("replace", controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const refetch = useCallback(() => {
    setRefreshing(true)
    void run("replace").finally(() => setRefreshing(false))
  }, [run])

  /**
   * Live sync: re-read as many rows as are loaded (page 1, bigger page) and
   * swap them in place. New conversations and changed ones (new message)
   * are flagged for a short highlight; brand-new ones go to `onNew`.
   */
  const sync = useCallback(() => {
    if (syncing.current || state !== "ready") return
    syncing.current = true
    const key = localKey.current
    const size = Math.min(Math.max(itemsRef.current.length, pageSize), 50)
    void getDashboardAdapter()
      .listConversations(filtersRef.current, { page: 1, pageSize: size })
      .then((result) => {
        if (key !== pendingKey.current) return
        const before = new Map(itemsRef.current.map((item) => [item.id, item]))
        const arrived = result.data.filter((item) => !before.has(item.id))
        const changed = result.data.filter((item) => {
          const old = before.get(item.id)
          return (
            old !== undefined &&
            (old.lastActivityAt !== item.lastActivityAt ||
              old.messageCount !== item.messageCount ||
              old.emergencyAt !== item.emergencyAt)
          )
        })
        // Keep any extra rows the operator loaded beyond the sync window.
        const synced = new Set(result.data.map((item) => item.id))
        const tail = itemsRef.current
          .slice(size)
          .filter((item) => !synced.has(item.id))
        setItems([...result.data, ...tail])
        setTotal(result.total)
        setGeneratedAt(result.generatedAt)
        pageRef.current = Math.max(1, Math.ceil(size / pageSize))
        const flagged = [...arrived, ...changed].map((item) => item.id)
        if (flagged.length > 0) {
          setFreshIds(new Set(flagged))
          window.setTimeout(() => setFreshIds(new Set()), 4000)
        }
        if (arrived.length > 0 && before.size > 0) onNewRef.current?.(arrived)
      })
      .catch(() => {
        /* transient: the next tick retries; the visible list stays */
      })
      .finally(() => {
        syncing.current = false
      })
  }, [pageSize, state])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore(items.length, total)) return
    setLoadingMore(true)
    void run("more").finally(() => setLoadingMore(false))
  }, [items.length, loadingMore, run, total])

  const patchLocal = useCallback(
    (conversationId: string, patch: Partial<ConversationSummary>) => {
      setItems((previous) =>
        previous.map((item) =>
          item.id === conversationId ? { ...item, ...patch } : item,
        ),
      )
    },
    [],
  )

  return {
    items,
    total,
    loading: state === "initial",
    loadingMore,
    refreshing,
    error,
    hasMore: hasMore(items.length, total),
    generatedAt,
    loadMore,
    refetch,
    sync,
    freshIds,
    patchLocal,
  }
}

function hasMore(shown: number, total: number): boolean {
  return total > shown
}
