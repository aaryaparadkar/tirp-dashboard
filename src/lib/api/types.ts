/**
 * Shared domain types for the TIRP dashboard.
 *
 * These types mirror what the dashboard needs from `tirp-server`. The HTTP
 * adapter does not exist yet (see `src/lib/api/mock.ts` for the interim
 * adapter and `src/lib/api/README.md` for the Phase 3 HTTP contract), so
 * until then the views run on the mock adapter — which is honest about what
 * the backend can and cannot do today.
 */

/* ---------------------------------------------------------------- intents */

/** The intent taxonomy mirrors `tirp-server`'s `Intent` union exactly. */
export type Intent =
  | "greeting"
  | "coverage"
  | "claims"
  | "reimbursements"
  | "healthcare_navigation"
  | "providers"
  | "pharmacy"
  | "medicines"
  | "visa_compliance"
  | "waiting_periods"
  | "student_rewards"
  | "updates"
  | "forms_and_guides"
  | "support"
  | "emergency"
  | "unknown"

export const INTENTS: readonly Intent[] = [
  "greeting",
  "coverage",
  "claims",
  "reimbursements",
  "healthcare_navigation",
  "providers",
  "pharmacy",
  "medicines",
  "visa_compliance",
  "waiting_periods",
  "student_rewards",
  "updates",
  "forms_and_guides",
  "support",
  "emergency",
  "unknown",
]

/** Human-readable intent labels; narrow rows where the label is long. */
export const INTENT_LABEL: Record<Intent, string> = {
  greeting: "Greeting",
  coverage: "Cover",
  claims: "Claims",
  reimbursements: "Reimbursements",
  healthcare_navigation: "Healthcare navigation",
  providers: "Providers",
  pharmacy: "Pharmacy",
  medicines: "Medicines",
  visa_compliance: "Visa compliance",
  waiting_periods: "Waiting periods",
  student_rewards: "Student rewards",
  updates: "Updates",
  forms_and_guides: "Forms and guides",
  support: "Support",
  emergency: "Emergency",
  unknown: "Unclassified",
}

/* --------------------------------------------------------------- statuses */

export const CONVERSATION_STATUSES = [
  "new",
  "in_progress",
  "awaiting_contact",
  "needs_review",
  "resolved",
  "failed",
] as const

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number]

/** Local tone union; `components/app` re-exports the shared `StatusTone`. */
export type StatusToneLocal =
  "neutral" | "primary" | "success" | "warning" | "danger" | "info"

export const STATUS_TONE: Record<ConversationStatus, StatusToneLocal> = {
  new: "info",
  in_progress: "primary",
  awaiting_contact: "neutral",
  needs_review: "warning",
  resolved: "success",
  failed: "danger",
}

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_contact: "Awaiting reply",
  needs_review: "Needs review",
  resolved: "Resolved",
  failed: "Failed",
}

/* ---------------------------------------------------------- handling mode */

export const HANDLING_MODES = ["ai", "human", "escalated"] as const

export type HandlingMode = (typeof HANDLING_MODES)[number]

export const HANDLING_LABEL: Record<HandlingMode, string> = {
  ai: "AI handled",
  human: "Human agent",
  escalated: "Escalated",
}

export const HANDLING_TONE: Record<HandlingMode, StatusToneLocal> = {
  ai: "primary",
  human: "info",
  escalated: "warning",
}

/* --------------------------------------------------------------- messages */

export type MessageDirection = "inbound" | "outbound"

export type MessageKind = "message" | "system"

export type AuthorType = "contact" | "assistant" | "operator" | "system"

export type DeliveryState = "pending" | "delivered" | "failed" | "unsupported"

export interface Message {
  /** Stable id. Optimistic (unsent) messages carry a `client-` prefix. */
  id: string
  conversationId: string
  direction: MessageDirection
  kind: MessageKind
  /** Who produced this item; used for sender labels. */
  author: { type: AuthorType; name: string }
  /** Message body, or a short description for system events. */
  body: string
  /** ISO 8601 instant in UTC. */
  createdAt: string
  intent?: Intent
  /** Assistant metadata — surfaced in the detail view only. */
  llmModel?: string
  latencyMs?: number
  sourceIds?: string[]
  delivery?: DeliveryState
  /** Operator-facing note on failed sends; pairs with the retry affordance. */
  failureNote?: string
}

export interface MessageDraft {
  conversationId: string
  body: string
  clientTag: string
}

/* ---------------------------------------------------------- conversations */

export type DashboardLanguage = "en" | "zh-CN" | "es"

export const LANGUAGES: readonly DashboardLanguage[] = ["en", "zh-CN", "es"]

export const LANGUAGE_LABEL: Record<DashboardLanguage, string> = {
  en: "English",
  "zh-CN": "简体中文",
  es: "Español",
}

export interface ContactRef {
  id: string
  /**
   * Masked number for display, e.g. "+61 ••• ••• 620". The browser never
   * receives the raw E.164 value — masking happens server-side.
   */
  maskedPhone: string
  displayName: string
  /** Two-letter fallback for the avatar. */
  initials: string
  language: DashboardLanguage
  optedIn: boolean
}

export interface ConversationSummary {
  id: string
  contact: ContactRef
  status: ConversationStatus
  intent: Intent
  handlingMode: HandlingMode
  /** Short snippet of the most recent message, subject to privacy rules. */
  lastMessagePreview: string
  lastMessageDirection: MessageDirection
  /** ISO 8601 instant in UTC. */
  lastActivityAt: string
  /** Dataset snapshot time; lets relative labels stay SSR-stable. */
  generatedAt: string
  startedAt: string
  messageCount: number
  unreadCount: number
  hasError: boolean
  language: DashboardLanguage
}

export interface ConversationDetail {
  summary: ConversationSummary
  messages: Message[]
  /** Operator-facing analysis of the thread, populated server-side. */
  summaryLines: string[]
  /** Knowledge-base sources most recently cited in the thread. */
  recentSources: { id: string; title: string; url: string }[]
}

/* -------------------------------------------------------------- filters */

export type RangeId = "24h" | "7d" | "30d"

export const RANGES: { id: RangeId; label: string }[] = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
]

export type SortId = "recent" | "oldest" | "unread" | "idle"

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "recent", label: "Newest activity first" },
  { id: "oldest", label: "Oldest activity first" },
  { id: "unread", label: "Unread first" },
  { id: "idle", label: "Longest waiting" },
]

export interface ConversationFilters {
  search: string
  status: ConversationStatus | "all"
  intent: Intent | "all"
  language: DashboardLanguage | "all"
  direction: MessageDirection | "all"
  handling: HandlingMode | "all"
  hasError: "all" | "with-error"
  range: RangeId
  sort: SortId
}

export const DEFAULT_FILTERS: ConversationFilters = {
  search: "",
  status: "all",
  intent: "all",
  language: "all",
  direction: "all",
  handling: "all",
  hasError: "all",
  range: "7d",
  sort: "recent",
}

/* ----------------------------------------------------- overview snapshot */

export interface KpiMetric {
  id: string
  label: string
  /** Raw metric value, or null when the backend does not provide it. */
  value: number | null
  unit: "count" | "pct" | "ms"
  /** Percentual change versus the previous period; null when unknown. */
  changePct: number | null
  /** Direction that counts as an improvement; latency improves downward. */
  betterWhen: "up" | "down"
  hint: string
}

export interface TimelinePoint {
  label: string
  inbound: number
  outbound: number
}

export interface IntentSlice {
  intent: Intent
  label: string
  count: number
  sharePct: number
}

export interface StatusSlice {
  status: ConversationStatus
  label: string
  count: number
  sharePct: number
}

export interface ShareSlice {
  id: string
  label: string
  count: number
  sharePct: number
}

export interface OverviewSnapshot {
  range: RangeId
  /** Fixed fixture timestamp so SSR and client hydration agree. */
  generatedAt: string
  kpis: KpiMetric[]
  timeline: TimelinePoint[]
  intents: IntentSlice[]
  statuses: StatusSlice[]
  languages: ShareSlice[]
  direction: { inbound: number; outbound: number }
  errors: ShareSlice[]
  peakTimes: { windowLabel: string; detail: string }[]
}

/* --------------------------------------------------------------- triggers */

export type TriggerFieldKind = "phone" | "text" | "conversation"

export interface TriggerField {
  id: string
  kind: TriggerFieldKind
  label: string
  description?: string
  required: boolean
  placeholder?: string
  /** Applies to `text`; `phone` fields are E.164-validated. */
  maxLength?: number
}

export type TriggerAvailability = "available" | "coming_soon" | "needs_config"

export const TRIGGER_AVAILABILITY_LABEL: Record<TriggerAvailability, string> = {
  available: "Available",
  coming_soon: "Coming soon",
  needs_config: "Needs configuration",
}

export interface TriggerDefinition {
  id: string
  name: string
  description: string
  intendedUse: string
  /** Backend dependency summary, surfaced in the run dialog. */
  backendNote: string
  availability: TriggerAvailability
  availabilityNote?: string
  fields: TriggerField[]
}

export type TriggerExecutionStatus =
  "running" | "success" | "failed" | "rejected"

export interface TriggerExecution {
  id: string
  triggerId: string
  triggerName: string
  status: TriggerExecutionStatus
  operator: string
  /** Masked target, e.g. "+61 ••• ••• 620" or a conversation title. */
  target: string
  /** Conversations this execution was linked to, when one exists. */
  conversationId?: string
  startedAt: string
  durationMs?: number
  /** Where the record came from: the server log or this browser session. */
  sync: "server" | "local"
  result?: { reference?: string; detail?: string }
  error?: { code: string; message: string }
}

/* ---------------------------------------------------------------- errors */

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "not_found"
  | "validation"
  | "conflict"
  | "unavailable"
  | "unsupported"
  | "network"

export interface ApiError {
  code: ApiErrorCode
  title: string
  message: string
  /** HTTP status returned by the backend, when this came from the network. */
  status?: number
  docs?: { path?: string }
}

/* ------------------------------------------------------------- pagination */

export interface Page<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  /** Server snapshot time for the page; relative labels derive from it. */
  generatedAt: string
}

/** Promise rejection type used across the client layer. */
export type ClientError = ApiError

/* --------------------------------------------------------------- session */

export type OperatorRole = "viewer" | "operator" | "supervisor" | "admin"

export const OPERATOR_ROLE_LABEL: Record<OperatorRole, string> = {
  viewer: "Viewer",
  operator: "Operator",
  supervisor: "Supervisor",
  admin: "Administrator",
}

export interface Operator {
  id: string
  email: string
  name: string
  role: OperatorRole
}

/** Authenticated operator session returned by the dashboard backend. */
export interface SessionInfo {
  operator: Operator
  /** Double-submit token required on every mutation. */
  csrfToken: string
  expiresAt: string
}

/** Outcome of an escalation, including partial success. */
export interface EscalationResult {
  summary: ConversationSummary
  notified: boolean
  partialError?: string
}
