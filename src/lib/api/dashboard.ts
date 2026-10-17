/**
 * Dashboard adapter.
 *
 * The console reads and writes through a single `DashboardAdapter`. Two
 * implementations exist:
 *
 * - `mockAdapter` (this file): deterministic fixtures, used for design work
 *   and offline development. Mutations return the structured `unsupported`
 *   error — the console never fakes a send, a status change, or a trigger run.
 * - the HTTP adapter (`src/lib/api/http-adapter.ts`): talks to `tirp-server`'s
 *   `/dashboard/*` endpoints with a cookie session and CSRF token.
 *
 * `src/lib/api/client.ts` selects one at startup. Swapping adapters does not
 * change routes or components.
 */

import {
  CONVERSATIONS,
  EXECUTIONS,
  MOCK_NOW,
  RECENT_SOURCES,
  RICH_THREADS,
  SUMMARY_LINES,
  SUMMARY_LINES_STUB,
  TRIGGERS,
  overviewFor,
  stubThread,
} from "./mock-data"
import {
  INTENT_LABEL,
  STATUS_LABEL,
  type ApiError,
  type ApiErrorCode,
  type ClientError,
  type ConversationDetail,
  type ConversationFilters,
  type ConversationStatus,
  type ConversationSummary,
  type EscalationResult,
  type HandlingMode,
  type Intent,
  type Message,
  type MessageDraft,
  type OverviewSnapshot,
  type Page,
  type RangeId,
  type SortId,
  type TriggerDefinition,
  type TriggerExecution,
} from "./types"

/* --------------------------------------------------------------- errors */

export class DashboardApiError extends Error implements ApiError {
  readonly code: ApiErrorCode
  readonly title: string
  readonly status?: number
  readonly docs?: { path?: string }

  constructor(init: {
    code: ApiErrorCode
    title: string
    message: string
    status?: number
    docs?: { path?: string }
  }) {
    super(init.message)
    this.name = "DashboardApiError"
    this.code = init.code
    this.title = init.title
    this.status = init.status
    this.docs = init.docs
  }
}

/** Operator-safe titles for each backend error code. */
export const ERROR_TITLES: Record<ApiErrorCode, string> = {
  unauthorized: "Sign in required",
  forbidden: "Not permitted",
  rate_limited: "Too many requests",
  not_found: "Not found",
  validation: "Check the request",
  conflict: "That change is not allowed",
  unavailable: "The backend is unavailable",
  unsupported: "Not supported yet",
  network: "Could not reach the backend",
}

/**
 * Rejection used by the fixture adapter for every state-changing operation.
 * Built per call so no shared mutable error instance leaks between components.
 */
function unsupported(
  kind: "send" | "status" | "escalate" | "category" | "trigger",
): DashboardApiError {
  const copy: Record<typeof kind, { title: string; message: string }> = {
    send: {
      title: "Outbound messaging is not connected yet",
      message:
        "Sending a reply from the console needs an operator endpoint in tirp-server (POST /dashboard/conversations/:id/reply). The console is running on fixtures, so nothing left the browser. Your draft is preserved here.",
    },
    status: {
      title: "Status changes need the backend",
      message:
        "Applying a conversation status needs PATCH /dashboard/conversations/:id in tirp-server. The console is running on fixtures, so no change was made.",
    },
    escalate: {
      title: "Escalation is not connected yet",
      message:
        "Handing a conversation to the support desk needs POST /dashboard/conversations/:id/escalate. The console is running on fixtures, so nobody was notified.",
    },
    category: {
      title: "Category changes are not connected yet",
      message:
        "Reclassifying a conversation needs PATCH /dashboard/conversations/:id/intent in tirp-server. The console is running on fixtures, so the value is unchanged.",
    },
    trigger: {
      title: "Trigger runs are not connected yet",
      message:
        "Running a WhatsApp flow from the console needs the authenticated dashboard API. The console is running on fixtures, so no message was sent to anyone.",
    },
  }
  return new DashboardApiError({
    code: "unsupported",
    ...copy[kind],
    docs: { path: "src/lib/api/README.md" },
  })
}

/* ------------------------------------------------------------- filtering */

const RANGE_DAYS: Record<RangeId, number> = { "24h": 1, "7d": 7, "30d": 30 }

/**
 * Range window against the fixture's fixed `MOCK_NOW`, so SSR render and
 * client hydration always agree on which conversations are in range.
 */
function withinRange(summary: ConversationSummary, range: RangeId): boolean {
  const cutoff =
    new Date(summary.generatedAt).getTime() - RANGE_DAYS[range] * 86_400_000
  return new Date(summary.lastActivityAt).getTime() >= cutoff
}

function matchesFilters(
  summary: ConversationSummary,
  filters: ConversationFilters,
): boolean {
  if (filters.status !== "all" && summary.status !== filters.status)
    return false
  if (filters.intent !== "all" && summary.intent !== filters.intent)
    return false
  if (filters.language !== "all" && summary.language !== filters.language)
    return false
  if (filters.handling !== "all" && summary.handlingMode !== filters.handling)
    return false
  if (filters.hasError === "with-error" && !summary.hasError) return false
  if (
    filters.direction !== "all" &&
    summary.lastMessageDirection !== filters.direction
  )
    return false
  if (!withinRange(summary, filters.range)) return false
  const query = filters.search.trim().toLowerCase()
  if (query) {
    const haystack = [
      summary.contact.displayName,
      summary.contact.maskedPhone,
      summary.lastMessagePreview,
      INTENT_LABEL[summary.intent],
      STATUS_LABEL[summary.status],
    ]
      .join(" ")
      .toLowerCase()
    if (!haystack.includes(query)) return false
  }
  return true
}

const SORTERS: Record<
  SortId,
  (a: ConversationSummary, b: ConversationSummary) => number
> = {
  recent: (a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt),
  oldest: (a, b) => a.lastActivityAt.localeCompare(b.lastActivityAt),
  unread: (a, b) =>
    b.unreadCount - a.unreadCount ||
    b.lastActivityAt.localeCompare(a.lastActivityAt),
  idle: (a, b) => a.lastActivityAt.localeCompare(b.lastActivityAt),
}

export const CONVERSATION_PAGE_SIZE = 10

/* --------------------------------------------------------------- adapter */

export interface TriggerRunValues {
  phone?: string
  message?: string
  conversationId?: string
  idempotencyKey?: string
}

export interface DashboardAdapter {
  /** "mock" while the dashboard runs on fixtures; "http" once connected. */
  readonly name: "mock" | "http"
  getOverview(range: RangeId, signal?: AbortSignal): Promise<OverviewSnapshot>
  listConversations(
    filters: ConversationFilters,
    page: Pick<Page<ConversationSummary>, "page" | "pageSize">,
    signal?: AbortSignal,
  ): Promise<Page<ConversationSummary>>
  getConversation(id: string, signal?: AbortSignal): Promise<ConversationDetail>
  /**
   * Operator reply. The response carries the stored message. When delivery
   * failed the message has a `failed` delivery state and `error` is set, so
   * the detail view can offer retry without pretending the send succeeded.
   */
  sendMessage(
    draft: MessageDraft,
  ): Promise<{ message: Message; error?: ClientError }>
  /** Local-only bookkeeping: clear or set the unread badge. */
  markRead(conversationId: string, unread: boolean): Promise<{ ok: true }>
  /** Local-only bookkeeping for handling mode notes. */
  setHandling(
    conversationId: string,
    handling: HandlingMode,
  ): Promise<{ ok: true }>
  requestStatusChange(
    conversationId: string,
    next: ConversationStatus,
  ): Promise<ConversationSummary>
  requestEscalation(
    conversationId: string,
    note: string,
  ): Promise<EscalationResult>
  requestCategoryChange(
    conversationId: string,
    next: Intent,
  ): Promise<ConversationSummary>
  listTriggerDefinitions(signal?: AbortSignal): Promise<TriggerDefinition[]>
  listTriggerExecutions(signal?: AbortSignal): Promise<TriggerExecution[]>
  runTrigger(
    triggerId: string,
    values: TriggerRunValues,
  ): Promise<TriggerExecution>
}

const CONVERSATION_INDEX = new Map(CONVERSATIONS.map((item) => [item.id, item]))

function threadFor(summary: ConversationSummary): Message[] {
  const rich = RICH_THREADS[summary.id]
  if (rich) return rich
  const stub = stubThread(summary)
  if (summary.hasError) {
    stub.push({
      id: `${summary.id}-s5`,
      conversationId: summary.id,
      direction: "outbound",
      kind: "system",
      author: { type: "system", name: "System" },
      body: "Fallback: outbound rate limit hit. The contact was asked to reply again shortly.",
      createdAt: summary.lastActivityAt,
    })
  }
  return stub
}

function detailFor(summary: ConversationSummary): ConversationDetail {
  return {
    summary,
    messages: threadFor(summary),
    summaryLines: SUMMARY_LINES[summary.id] ?? SUMMARY_LINES_STUB,
    recentSources: RECENT_SOURCES[summary.id] ?? [],
  }
}

/** Small await so loading states are observable in the UI. No timers in SSR. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export const mockAdapter: DashboardAdapter = {
  name: "mock",

  async getOverview(range) {
    await delay(240)
    return overviewFor(range)
  },

  async listConversations(filters, page) {
    await delay(180)
    const filtered = CONVERSATIONS.filter((summary) =>
      matchesFilters(summary, filters),
    )
    const sorted = [...filtered].sort(SORTERS[filters.sort])
    const start = (page.page - 1) * page.pageSize
    return {
      data: sorted.slice(start, start + page.pageSize),
      page: page.page,
      pageSize: page.pageSize,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / page.pageSize)),
      generatedAt: MOCK_NOW,
    }
  },

  async getConversation(id) {
    await delay(220)
    const summary = CONVERSATION_INDEX.get(id)
    if (!summary) {
      throw new DashboardApiError({
        code: "not_found",
        title: "Conversation not found",
        message:
          "That conversation is not in the current snapshot. It may have been archived.",
        status: 404,
      })
    }
    return detailFor(summary)
  },

  async sendMessage(draft) {
    await delay(620)
    const message: Message = {
      id: draft.clientTag,
      conversationId: draft.conversationId,
      direction: "outbound",
      kind: "message",
      author: { type: "operator", name: "Operator" },
      body: draft.body,
      createdAt: MOCK_NOW,
      delivery: "failed",
      failureNote:
        "The console is running on fixtures; no endpoint was called.",
    }
    return { message, error: unsupported("send") }
  },

  async markRead() {
    await delay(90)
    return { ok: true }
  },

  async setHandling() {
    await delay(80)
    return { ok: true }
  },

  async requestStatusChange() {
    await delay(320)
    throw unsupported("status")
  },

  async requestEscalation() {
    await delay(420)
    throw unsupported("escalate")
  },

  async requestCategoryChange() {
    await delay(320)
    throw unsupported("category")
  },

  async listTriggerDefinitions() {
    await delay(200)
    return [...TRIGGERS]
  },

  async listTriggerExecutions() {
    await delay(220)
    return [...EXECUTIONS]
  },

  async runTrigger(triggerId) {
    await delay(480)
    const trigger = TRIGGERS.find((item) => item.id === triggerId)
    const base = unsupported("trigger")
    throw new DashboardApiError({
      code: base.code,
      title: base.title,
      message: trigger
        ? `“${trigger.name}” would message a real contact, so the fixture console refuses to fake it. ${base.message}`
        : base.message,
      docs: base.docs,
    })
  },
}

let activeAdapter: DashboardAdapter = mockAdapter

/** Swap point: `setDashboardAdapter(createHttpAdapter(...))`. */
export function setDashboardAdapter(adapter: DashboardAdapter): void {
  activeAdapter = adapter
}

export function getDashboardAdapter(): DashboardAdapter {
  return activeAdapter
}

/** True while the console runs on deterministic fixtures. */
export function isMockAdapter(): boolean {
  return activeAdapter.name === "mock"
}

/* ---------------------------------------------------- operator mutations */

/**
 * These helpers delegate to the active adapter so components never choose an
 * implementation. On fixtures they throw the structured `unsupported` error;
 * against the HTTP adapter they perform the real mutation and return the
 * updated summary.
 */
export function requestStatusChange(
  conversationId: string,
  next: ConversationStatus,
): Promise<ConversationSummary> {
  return activeAdapter.requestStatusChange(conversationId, next)
}

export function requestEscalation(
  conversationId: string,
  note: string,
): Promise<EscalationResult> {
  return activeAdapter.requestEscalation(conversationId, note)
}

export function requestCategoryChange(
  conversationId: string,
  next: Intent,
): Promise<ConversationSummary> {
  return activeAdapter.requestCategoryChange(conversationId, next)
}

export function runTrigger(
  triggerId: string,
  values: TriggerRunValues,
): Promise<TriggerExecution> {
  return activeAdapter.runTrigger(triggerId, values)
}
