/**
 * HTTP adapter — the console's real backend.
 *
 * Maps the dashboard's typed operations onto `tirp-server`'s `/dashboard/*`
 * routes. Reads use `GET`, mutations authenticate with the session cookie and
 * CSRF token (added by `http.ts`). Phone numbers arrive already masked.
 */

import { DashboardApiError } from "./dashboard"
import type { DashboardAdapter, TriggerRunValues } from "./dashboard"
import { apiFetch, apiRequest, toApiError } from "./http"
import type {
  ConversationDetail,
  ConversationFilters,
  ConversationStatus,
  ConversationSummary,
  EscalationResult,
  HandlingMode,
  Intent,
  Message,
  MessageDraft,
  OverviewSnapshot,
  Page,
  RangeId,
  TriggerDefinition,
  TriggerExecution,
} from "./types"

interface ServerPage<T> {
  data: T[]
  page: number
  page_size: number
  total: number
  total_pages: number
  generated_at?: string
}

function toPage<T>(server: ServerPage<T>): Page<T> {
  return {
    data: server.data ?? [],
    page: server.page,
    pageSize: server.page_size,
    total: server.total,
    totalPages: server.total_pages,
    generatedAt: server.generated_at ?? new Date().toISOString(),
  }
}

function conversationQuery(
  filters: ConversationFilters,
  page: Pick<Page<ConversationSummary>, "page" | "pageSize">,
): string {
  const params = new URLSearchParams({
    page: String(page.page),
    page_size: String(page.pageSize),
    range: filters.range,
    sort: filters.sort,
  })
  if (filters.status !== "all") params.set("status", filters.status)
  if (filters.intent !== "all") params.set("intent", filters.intent)
  if (filters.language !== "all") params.set("language", filters.language)
  if (filters.direction !== "all") params.set("direction", filters.direction)
  if (filters.handling !== "all") params.set("handling", filters.handling)
  if (filters.hasError === "with-error") params.set("has_error", "with-error")
  const query = filters.search.trim()
  if (query) params.set("q", query)
  return params.toString()
}

function encoded(id: string): string {
  return encodeURIComponent(id)
}

/** Generate a client tag when the caller did not supply one. */
function clientTag(provided?: string): string {
  if (provided) return provided
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `op-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

export function createHttpAdapter(): DashboardAdapter {
  return {
    name: "http",

    getOverview(range: RangeId, signal?: AbortSignal) {
      return apiRequest<OverviewSnapshot>(
        `/dashboard/overview?range=${encodeURIComponent(range)}`,
        { signal },
      )
    },

    async listConversations(filters, page, signal) {
      const server = await apiRequest<ServerPage<ConversationSummary>>(
        `/dashboard/conversations?${conversationQuery(filters, page)}`,
        { signal },
      )
      return toPage(server)
    },

    getConversation(id: string, signal?: AbortSignal) {
      return apiRequest<ConversationDetail>(
        `/dashboard/conversations/${encoded(id)}`,
        { signal },
      )
    },

    async sendMessage(draft: MessageDraft) {
      const tag = draft.clientTag ?? clientTag()
      const result = await apiFetch<{ message?: Message }>(
        `/dashboard/conversations/${encoded(draft.conversationId)}/reply`,
        { method: "POST", body: { body: draft.body, clientTag: tag } },
      )
      if (result.ok && result.payload?.message) {
        return { message: result.payload.message }
      }
      // A failed send may still carry the stored message so the UI can show it
      // with a retry affordance rather than losing the operator's words.
      const error = toApiError(result.status, result.payload)
      if (result.payload?.message) {
        return { message: result.payload.message, error }
      }
      throw error
    },

    async markRead() {
      return { ok: true }
    },

    async setHandling(_conversationId: string, _handling: HandlingMode) {
      return { ok: true }
    },

    async requestStatusChange(
      conversationId: string,
      next: ConversationStatus,
    ) {
      const result = await apiRequest<{ summary: ConversationSummary }>(
        `/dashboard/conversations/${encoded(conversationId)}`,
        { method: "PATCH", body: { status: next } },
      )
      return result.summary
    },

    async requestEscalation(conversationId: string, note: string) {
      return apiRequest<EscalationResult>(
        `/dashboard/conversations/${encoded(conversationId)}/escalate`,
        { method: "POST", body: { note } },
      )
    },

    async requestCategoryChange(conversationId: string, next: Intent) {
      const result = await apiRequest<{ summary: ConversationSummary }>(
        `/dashboard/conversations/${encoded(conversationId)}/intent`,
        { method: "PATCH", body: { intent: next } },
      )
      return result.summary
    },

    async listTriggerDefinitions(signal?: AbortSignal) {
      const result = await apiRequest<{ data: TriggerDefinition[] }>(
        "/dashboard/triggers",
        { signal },
      )
      return result.data
    },

    async listTriggerExecutions(signal?: AbortSignal) {
      const result = await apiRequest<ServerPage<TriggerExecution>>(
        "/dashboard/trigger-executions?page=1&page_size=50",
        { signal },
      )
      return result.data
    },

    async runTrigger(triggerId: string, values: TriggerRunValues) {
      const result = await apiRequest<{ execution: TriggerExecution }>(
        `/dashboard/triggers/${encoded(triggerId)}/run`,
        {
          method: "POST",
          body: {
            phone: values.phone,
            message: values.message,
            conversationId: values.conversationId,
            idempotencyKey: values.idempotencyKey ?? clientTag(),
          },
        },
      )
      if (!result.execution) {
        throw new DashboardApiError({
          code: "unavailable",
          title: "The run did not return a result",
          message:
            "tirp-server accepted the request but returned no execution record.",
        })
      }
      return result.execution
    },
  }
}
