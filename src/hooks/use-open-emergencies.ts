import { useMemo } from "react"

import { useDashboardQuery } from "@/hooks/use-dashboard-query"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { getDashboardAdapter } from "@/lib/api/dashboard"
import {
  DEFAULT_FILTERS,
  type ConversationSummary,
  type Page,
} from "@/lib/api/types"

const POLL_MS = 15_000

/**
 * Unresolved conversations in the last 7 days where the assistant showed the
 * Call 000 button. Polls every 15 s (while the tab is visible) so the sidebar and overview stay
 * current without a manual refresh.
 */
export function useOpenEmergencies() {
  const query = useDashboardQuery<Page<ConversationSummary>>(
    () =>
      getDashboardAdapter().listConversations(
        { ...DEFAULT_FILTERS, emergency: "only", range: "7d", sort: "recent" },
        { page: 1, pageSize: 20 },
      ),
    [],
  )
  useLiveRefresh(query.refetch, POLL_MS)

  const open = useMemo(
    () =>
      (query.data?.data ?? []).filter(
        (item) => item.emergencyAt && item.status !== "resolved",
      ),
    [query.data],
  )

  return { open, loading: query.loading, error: query.error }
}
