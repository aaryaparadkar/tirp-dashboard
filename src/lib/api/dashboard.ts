/**
 * In-browser dashboard adapter.
 *
 * Reads are served from deterministic fixtures (see `mock-data.ts`) so every
 * view can be designed and reviewed before Phase 3. Writes mirror reality:
 * `tirp-server` has no dashboard endpoints yet, so every mutating call
 * returns a structured "unsupported" error. The UI must present that error
 * verbatim — it must never render a simulated success for send, status, or
 * trigger actions. See `src/lib/api/README.md` for the Phase 3 HTTP contract
 * these calls are written against.
 */

import { maskPhone } from "../format"
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

/**
 * Rejection used for every state-changing operation until Phase 3 ships the
 * endpoints. Built per call so no shared mutable error instance leaks
 * between components.
 */
function unsupported(
  kind: "send" | "status" | "escalate" | "category" | "trigger",
): DashboardApiError {
  const copy: Record<typeof kind, { title: string; message: string }> = {
    send: {
      title: "Outbound messaging is not connected yet",
      message:
        "Sending a reply from the console needs an operator endpoint in tirp-server (POST /dashboard/conversations/:id/reply). It is part of the Phase 3 API work, so nothing left the dashboard. Your draft is preserved here.",
    },
    status: {
      title: "Status changes need the backend",
      message:
        "Applying a conversation status needs PATCH /dashboard/conversations/:id in tirp-server. Until Phase 3 the console makes no change at all — the status still reads as the assistant left it, on WhatsApp and in the database.",
    },
    escalate: {
      title: "Escalation is not connected yet",
      message:
        "Handing a conversation to the support desk needs POST /dashboard/conversations/:id/escalate. Phase 3 wires it through the existing Kapso send primitives.",
    },
    category: {
      title: "Category changes are not connected yet",
      message:
        "Reclassifying a conversation needs PATCH /dashboard/conversations/:id/intent in tirp-server. Until then the value stays as the assistant classified it.",
    },
    trigger: {
      title: "Trigger runs are not connected yet",
      message:
        "Running a WhatsApp flow from the console needs an authenticated dashboard proxy in tirp-server (the browser must never hold KAPSO or trigger tokens). Phase 3 wires it; for now no message was sent to anyone.",
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
      maskPhone(summary.contact.phone),
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

export interface DashboardAdapter {
  /** "mock" while the dashboard runs on fixtures; "http" after Phase 3. */
  readonly name: "mock" | "http"
  getOverview(range: RangeId): Promise<OverviewSnapshot>
  listConversations(
    filters: ConversationFilters,
    page: Pick<Page<ConversationSummary>, "page" | "pageSize">,
  ): Promise<Page<ConversationSummary>>
  getConversation(id: string): Promise<ConversationDetail>
  /**
   * Operator reply. The mock returns the composed message with a `failed`
   * delivery state plus the structured "unsupported" error; the detail view
   * shows it and offers retry. No message leaves the console.
   */
  sendMessage(
    draft: MessageDraft,
  ): Promise<{ message: Message; error: ClientError }>
  /** Local-only bookkeeping: clear or set the unread badge. */
  markRead(conversationId: string, unread: boolean): Promise<{ ok: true }>
  /** Local-only bookkeeping for handling mode notes. */
  setHandling(
    conversationId: string,
    handling: HandlingMode,
  ): Promise<{ ok: true }>
  listTriggerDefinitions(): Promise<TriggerDefinition[]>
  listTriggerExecutions(): Promise<TriggerExecution[]>
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
      failureNote: "Outbound send endpoint is not configured yet (Phase 3).",
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

  async listTriggerDefinitions() {
    await delay(200)
    return [...TRIGGERS]
  },

  async listTriggerExecutions() {
    await delay(220)
    return [...EXECUTIONS]
  },
}

let activeAdapter: DashboardAdapter = mockAdapter

/** Swap point for Phase 3: `setDashboardAdapter(createHttpAdapter(...))`. */
export function setDashboardAdapter(adapter: DashboardAdapter): void {
  activeAdapter = adapter
}

export function getDashboardAdapter(): DashboardAdapter {
  return activeAdapter
}

/* ---------------------------------------------------- pending mutations */

/**
 * Structured rejections for operator actions that need Phase 3 endpoints.
 * Each helper awaits a beat so pending/sending states are observable, then
 * throws exactly the error the UI renders. No side effects, no simulated
 * success.
 */
export async function requestStatusChange(
  conversationId: string,
  next: ConversationStatus,
): Promise<never> {
  void conversationId
  void next
  await delay(320)
  throw unsupported("status")
}

export async function requestEscalation(
  conversationId: string,
  note: string,
): Promise<never> {
  void conversationId
  void note
  await delay(420)
  throw unsupported("escalate")
}

export async function requestCategoryChange(
  conversationId: string,
  next: Intent,
): Promise<never> {
  void conversationId
  void next
  await delay(320)
  throw unsupported("category")
}

/* ------------------------------------------------------------ triggers */

export interface TriggerRunValues {
  phone?: string
  message?: string
  conversationId?: string
}

/**
 * Runs a trigger through the adapter. Today this always rejects with the
 * structured "unsupported" error — the run dialog must show it verbatim and
 * must not fake success. Phase 3 will call POST /dashboard/triggers/:id/run.
 */
export async function runTrigger(
  triggerId: string,
  values: TriggerRunValues,
): Promise<never> {
  await delay(480)
  const trigger = TRIGGERS.find((item) => item.id === triggerId)
  void values
  const base = unsupported("trigger")
  throw new DashboardApiError({
    code: base.code,
    title: base.title,
    message: trigger
      ? `“${trigger.name}” would message a real contact, so the console refuses to fake it. ${base.message}`
      : base.message,
    docs: base.docs,
  })
}
