/**
 * Deterministic fixtures for the dashboard while `tirp-server` does not yet
 * expose dashboard endpoints (see `src/lib/api/README.md`).
 *
 * Rules for this file:
 * - No `Date.now()`, no `Math.random()`, no timers. Every value is either a
 *   literal or derived from a literal with pure math, so the server render
 *   and the client hydration produce identical output.
 * - Phone numbers in fixtures are withheld from rendering; the UI masks them
 *   through `maskPhone()`. The raw values live here only as adapter data.
 * - Message content must not contain real personal data.
 */

import {
  INTENT_LABEL,
  STATUS_LABEL,
  type ConversationSummary,
  type Intent,
  type IntentSlice,
  type Message,
  type OverviewSnapshot,
  type RangeId,
  type ShareSlice,
  type TimelinePoint,
  type TriggerDefinition,
  type TriggerExecution,
} from "./types"
import { maskPhone } from "../format"

/** Fixed "dataset captured at" instant. All relative labels derive from it. */
export const MOCK_NOW = "2026-10-17T16:00:00Z"

/* ------------------------------------------------------------- contacts */

interface PersonaSeed {
  contactId: string
  phone: string
  name: string
  initials: string
  language: "en" | "zh-CN" | "es"
}

const PERSONAS: PersonaSeed[] = [
  {
    contactId: "ct-4101",
    phone: "+61412345620",
    name: "Aisha Khan",
    initials: "AK",
    language: "en",
  },
  {
    contactId: "ct-4102",
    phone: "+61498331177",
    name: "Marco Silva",
    initials: "MS",
    language: "en",
  },
  {
    contactId: "ct-4103",
    phone: "+61455042891",
    name: "Priya Nair",
    initials: "PN",
    language: "en",
  },
  {
    contactId: "ct-4104",
    phone: "+61472910355",
    name: "Chen Wei",
    initials: "CW",
    language: "zh-CN",
  },
  {
    contactId: "ct-4105",
    phone: "+61438871264",
    name: "Sofia Rossi",
    initials: "SR",
    language: "en",
  },
  {
    contactId: "ct-4106",
    phone: "+61411820394",
    name: "Liam Fraser",
    initials: "LF",
    language: "en",
  },
  {
    contactId: "ct-4107",
    phone: "+61465590218",
    name: "Yuki Tanaka",
    initials: "YT",
    language: "zh-CN",
  },
  {
    contactId: "ct-4108",
    phone: "+61452033740",
    name: "Grace Adeyemi",
    initials: "GA",
    language: "en",
  },
  {
    contactId: "ct-4109",
    phone: "+61487460523",
    name: "Omar Haddad",
    initials: "OH",
    language: "en",
  },
  {
    contactId: "ct-4110",
    phone: "+61429961877",
    name: "Elena Petrova",
    initials: "EP",
    language: "es",
  },
  {
    contactId: "ct-4111",
    phone: "+61473325486",
    name: "Noah Mensah",
    initials: "NM",
    language: "en",
  },
  {
    contactId: "ct-4112",
    phone: "+61460773912",
    name: "Isla Morgan",
    initials: "IM",
    language: "en",
  },
]

/* ---------------------------------------------------------------- threads */

/**
 * Hand-written threads for conversations the operator may open first. Every
 * other conversation gets a deterministic stub thread (see `stubThread`).
 */
export const RICH_THREADS: Record<string, Message[]> = {
  "c-001": [
    {
      id: "m-001-01",
      conversationId: "c-001",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Aisha Khan" },
      body: "Hi, I hurt my ankle playing soccer yesterday. Does my OSHC cover sports injuries?",
      createdAt: "2026-10-16T15:02:00Z",
      intent: "coverage",
    },
    {
      id: "m-001-02",
      conversationId: "c-001",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "Hi Aisha — sports injuries are covered under both Essentials and Comprehensive while playing organised sport. For treatment, you can visit a direct-billing clinic so you don't pay out of pocket.\n\nWant me to find the nearest direct-billing clinic or walk you through how a claim works?",
      createdAt: "2026-10-16T15:02:31Z",
      intent: "coverage",
      llmModel: "mistral-small-latest",
      latencyMs: 31_400,
      sourceIds: ["kb_coverage_sport", "kb_claims_howto"],
    },
    {
      id: "m-001-03",
      conversationId: "c-001",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Aisha Khan" },
      body: "Nearest clinic please",
      createdAt: "2026-10-16T15:03:05Z",
      intent: "providers",
    },
    {
      id: "m-001-04",
      conversationId: "c-001",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "The closest direct-billing clinic to the University of Melbourne area is:\n\n1. City Medical & Dental — 2.4 km, open until 8pm\n2. Carlton Family Practice — 3.1 km, open until 6pm\n\nBring your student ID and policy number. Would you like the addresses as a link?",
      createdAt: "2026-10-16T15:03:36Z",
      intent: "providers",
      llmModel: "mistral-small-latest",
      latencyMs: 22_100,
      sourceIds: ["kb_providers_direct_billing"],
    },
    {
      id: "m-001-05",
      conversationId: "c-001",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Aisha Khan" },
      body: "The link didn't open.",
      createdAt: "2026-10-16T15:04:12Z",
      intent: "support",
    },
    {
      id: "m-001-06",
      conversationId: "c-001",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "Sorry about that. Here are the addresses as plain text:\n\n· City Medical & Dental, 289 Brunswick St, Fitzroy\n· Carlton Family Practice, 55 Drummond St, Carlton\n\nIf the link keeps failing I can pass this to the support desk to publish a new page.",
      createdAt: "2026-10-16T15:04:40Z",
      intent: "support",
      llmModel: "mistral-small-latest",
      latencyMs: 27_900,
      sourceIds: ["kb_providers_list"],
    },
    {
      id: "m-001-07",
      conversationId: "c-001",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Aisha Khan" },
      body: "Thanks, that clears it up.",
      createdAt: "2026-10-16T15:05:22Z",
      intent: "greeting",
    },
  ],
  "c-002": [
    {
      id: "m-002-01",
      conversationId: "c-002",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Marco Silva" },
      body: "What documents do I need to claim for a GP visit last week?",
      createdAt: "2026-10-17T13:20:00Z",
      intent: "claims",
    },
    {
      id: "m-002-02",
      conversationId: "c-002",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "For a GP claim you generally need:\n\n1. The itemised receipt showing the service and amount paid\n2. Your policy number\n3. A bank account for the refund (first claim only)\n\nUpload them in the OSHC app under Claims → New claim. Refunds usually land within 5 business days once the documents are accepted.",
      createdAt: "2026-10-17T13:20:28Z",
      intent: "claims",
      llmModel: "mistral-small-latest",
      latencyMs: 27_600,
      sourceIds: ["kb_claims_documents"],
    },
    {
      id: "m-002-03",
      conversationId: "c-002",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Marco Silva" },
      body: "The receipt has the practice logo but no item numbers. Will that be accepted?",
      createdAt: "2026-10-17T13:25:10Z",
      intent: "claims",
    },
    {
      id: "m-002-04",
      conversationId: "c-002",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "Item numbers help the assessor match the service to your policy, so receipts without them can be requested again — that saves you a second claim cycle.\n\nAsk the practice for an itemised statement (they print these on request). I can also hand this to the support desk if you want confirmation before you go back.",
      createdAt: "2026-10-17T13:25:41Z",
      intent: "claims",
      llmModel: "mistral-small-latest",
      latencyMs: 30_200,
      sourceIds: ["kb_claims_documents"],
    },
    {
      id: "m-002-05",
      conversationId: "c-002",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Marco Silva" },
      body: "Yes please pass it to the team",
      createdAt: "2026-10-17T13:31:02Z",
      intent: "support",
    },
    {
      id: "m-002-06",
      conversationId: "c-002",
      direction: "outbound",
      kind: "system",
      author: { type: "system", name: "System" },
      body: "Handed to human agent at the contact's request. Conversation marked for review.",
      createdAt: "2026-10-17T13:31:20Z",
    },
  ],
  "c-006": [
    {
      id: "m-006-01",
      conversationId: "c-006",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Chen Wei" },
      body: "需要看牙医，我的保险包含洗牙吗？",
      createdAt: "2026-10-17T11:40:00Z",
      intent: "coverage",
    },
    {
      id: "m-006-02",
      conversationId: "c-006",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "包括的——Essentials 每年提供一次洗牙（最高报销限额见您的保单），Comprehensive 的年度牙科额度更高。\n\n要看最近的直接结算诊所，还是了解报销流程？",
      createdAt: "2026-10-17T11:40:35Z",
      intent: "coverage",
      llmModel: "mistral-small-latest",
      latencyMs: 34_800,
      sourceIds: ["kb_coverage_dental", "kb_claims_howto"],
    },
    {
      id: "m-006-03",
      conversationId: "c-006",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Chen Wei" },
      body: "好的，发一下报流程",
      createdAt: "2026-10-17T11:48:02Z",
      intent: "reimbursements",
    },
    {
      id: "m-006-04",
      conversationId: "c-006",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "报销流程：\n\n1. 在 OSHC 应用打开 Claims → New claim\n2. 上传收据和保单号\n3. 填写银行账户（首次理赔）\n\n接受后一般 5 个工作日内到账。",
      createdAt: "2026-10-17T11:48:33Z",
      intent: "reimbursements",
      llmModel: "mistral-small-latest",
      latencyMs: 25_400,
      sourceIds: ["kb_claims_howto"],
    },
  ],
  "c-010": [
    {
      id: "m-010-01",
      conversationId: "c-010",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Omar Haddad" },
      body: "menu",
      createdAt: "2026-10-17T09:35:00Z",
      intent: "greeting",
    },
    {
      id: "m-010-02",
      conversationId: "c-010",
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "Hi, I'm the Medibank OSHC student assistant. I can help with cover, claims, providers, pharmacy, visa requirements, rewards, updates, forms — or urgent health issues.\n\nReply 1–9, tap an option, or just type your question.",
      createdAt: "2026-10-17T09:35:08Z",
      intent: "greeting",
      latencyMs: 1_240,
      sourceIds: [],
    },
    {
      id: "m-010-03",
      conversationId: "c-010",
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: "Omar Haddad" },
      body: "3",
      createdAt: "2026-10-17T09:36:00Z",
      intent: "providers",
    },
    {
      id: "m-010-04",
      conversationId: "c-010",
      direction: "outbound",
      kind: "system",
      author: { type: "system", name: "System" },
      body: "Rate limit hit for outbound menu message (too many requests this minute). Fallback notice sent instead.",
      createdAt: "2026-10-17T09:36:02Z",
    },
  ],
}

/* ------------------------------------------------------------ conversations */

export interface ConversationSeed {
  id: string
  personaIndex: number
  intent: Intent
  status: ConversationSummary["status"]
  handlingMode: ConversationSummary["handlingMode"]
  language: ConversationSummary["language"]
  unreadCount: number
  hasError: boolean
  messageCount: number
  startedAt: string
  lastActivityAt: string
  minutesSinceActivity: number
}

const CONVERSATION_SEEDS: ConversationSeed[] = [
  {
    id: "c-001",
    personaIndex: 0,
    intent: "coverage",
    status: "in_progress",
    handlingMode: "ai",
    language: "en",
    unreadCount: 0,
    hasError: false,
    messageCount: 8,
    startedAt: "2026-10-13T15:00:00Z",
    lastActivityAt: "2026-10-16T15:05:22Z",
    minutesSinceActivity: 1_495,
  },
  {
    id: "c-002",
    personaIndex: 1,
    intent: "claims",
    status: "needs_review",
    handlingMode: "human",
    language: "en",
    unreadCount: 2,
    hasError: false,
    messageCount: 6,
    startedAt: "2026-10-17T13:20:00Z",
    lastActivityAt: "2026-10-17T13:31:20Z",
    minutesSinceActivity: 149,
  },
  {
    id: "c-003",
    personaIndex: 2,
    intent: "forms_and_guides",
    status: "awaiting_contact",
    handlingMode: "ai",
    language: "en",
    unreadCount: 0,
    hasError: false,
    messageCount: 5,
    startedAt: "2026-10-17T12:02:00Z",
    lastActivityAt: "2026-10-17T12:09:44Z",
    minutesSinceActivity: 230,
  },
  {
    id: "c-004",
    personaIndex: 3,
    intent: "claims",
    status: "in_progress",
    handlingMode: "ai",
    language: "en",
    unreadCount: 1,
    hasError: false,
    messageCount: 7,
    startedAt: "2026-10-17T11:52:00Z",
    lastActivityAt: "2026-10-17T12:00:12Z",
    minutesSinceActivity: 240,
  },
  {
    id: "c-005",
    personaIndex: 4,
    intent: "waiting_periods",
    status: "new",
    handlingMode: "ai",
    language: "en",
    unreadCount: 3,
    hasError: false,
    messageCount: 2,
    startedAt: "2026-10-17T15:41:00Z",
    lastActivityAt: "2026-10-17T15:41:18Z",
    minutesSinceActivity: 19,
  },
  {
    id: "c-006",
    personaIndex: 3,
    intent: "coverage",
    status: "in_progress",
    handlingMode: "ai",
    language: "zh-CN",
    unreadCount: 0,
    hasError: false,
    messageCount: 4,
    startedAt: "2026-10-17T11:40:00Z",
    lastActivityAt: "2026-10-17T11:48:33Z",
    minutesSinceActivity: 252,
  },
  {
    id: "c-007",
    personaIndex: 5,
    intent: "providers",
    status: "new",
    handlingMode: "ai",
    language: "es",
    unreadCount: 2,
    hasError: false,
    messageCount: 3,
    startedAt: "2026-10-17T15:12:00Z",
    lastActivityAt: "2026-10-17T15:12:31Z",
    minutesSinceActivity: 48,
  },
  {
    id: "c-008",
    personaIndex: 6,
    intent: "student_rewards",
    status: "awaiting_contact",
    handlingMode: "ai",
    language: "en",
    unreadCount: 0,
    hasError: false,
    messageCount: 6,
    startedAt: "2026-10-16T14:00:00Z",
    lastActivityAt: "2026-10-17T15:38:05Z",
    minutesSinceActivity: 22,
  },
  {
    id: "c-009",
    personaIndex: 10,
    intent: "visa_compliance",
    status: "in_progress",
    handlingMode: "ai",
    language: "en",
    unreadCount: 0,
    hasError: false,
    messageCount: 5,
    startedAt: "2026-10-17T10:02:00Z",
    lastActivityAt: "2026-10-17T10:35:44Z",
    minutesSinceActivity: 324,
  },
  {
    id: "c-010",
    personaIndex: 8,
    intent: "providers",
    status: "failed",
    handlingMode: "ai",
    language: "en",
    unreadCount: 1,
    hasError: true,
    messageCount: 4,
    startedAt: "2026-10-17T09:35:00Z",
    lastActivityAt: "2026-10-17T09:36:02Z",
    minutesSinceActivity: 384,
  },
  {
    id: "c-011",
    personaIndex: 9,
    intent: "emergency",
    status: "resolved",
    handlingMode: "escalated",
    language: "es",
    unreadCount: 0,
    hasError: false,
    messageCount: 9,
    startedAt: "2026-10-16T20:14:00Z",
    lastActivityAt: "2026-10-16T20:26:40Z",
    minutesSinceActivity: 1_193,
  },
  {
    id: "c-012",
    personaIndex: 11,
    intent: "claims",
    status: "resolved",
    handlingMode: "ai",
    language: "en",
    unreadCount: 0,
    hasError: false,
    messageCount: 11,
    startedAt: "2026-10-15T14:00:00Z",
    lastActivityAt: "2026-10-16T00:12:40Z",
    minutesSinceActivity: 951,
  },
]

export const CONVERSATIONS: ConversationSummary[] = CONVERSATION_SEEDS.map(
  (seed) => {
    const persona = PERSONAS[seed.personaIndex]
    const lastMessagePreview = lastPreviewFor(seed.intent, seed.status)
    return {
      id: seed.id,
      contact: {
        id: persona.contactId,
        maskedPhone: maskPhone(persona.phone),
        displayName: persona.name,
        initials: persona.initials,
        language: persona.language,
        optedIn: true,
      },
      status: seed.status,
      intent: seed.intent,
      handlingMode: seed.handlingMode,
      lastMessagePreview,
      lastMessageDirection:
        seed.handlingMode === "ai" && seed.status === "awaiting_contact"
          ? "outbound"
          : "inbound",
      lastActivityAt: seed.lastActivityAt,
      generatedAt: MOCK_NOW,
      startedAt: seed.startedAt,
      messageCount: seed.messageCount,
      unreadCount: seed.unreadCount,
      hasError: seed.hasError,
      language: seed.language,
    }
  },
)

function lastPreviewFor(
  intent: Intent,
  status: ConversationSummary["status"],
): string {
  if (status === "failed") return "Fallback: rate limited"
  if (status === "awaiting_contact") return "Waiting for the contact to reply"
  if (intent === "claims") return "Item numbers were missing on that receipt"
  if (intent === "providers") return "Looking for direct-billing clinics"
  if (intent === "coverage") return "Dental cleaning is included in the policy"
  if (intent === "visa_compliance") return "Visa renewal needs an OSHC letter"
  if (intent === "emergency") return "Escalated to triage support line"
  if (intent === "student_rewards") return "Rewards balance not showing in app"
  if (intent === "waiting_periods")
    return "Waiting period ends before the policy date"
  if (intent === "forms_and_guides") return "Requested pharmacy claim form"
  return "General cover question"
}

/**
 * Deterministic stub thread for conversations without a hand-written one:
 * inbound greeting, assistant answer, and follow-up on the last preview.
 */
export function stubThread(summary: ConversationSummary): Message[] {
  const contactName = summary.contact.displayName
  return [
    {
      id: `${summary.id}-s1`,
      conversationId: summary.id,
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: contactName },
      body:
        sampleOpeners[summary.intent] ??
        "Hi, I have a question about my OSHC cover.",
      createdAt: summary.startedAt,
      intent: "greeting",
    },
    {
      id: `${summary.id}-s2`,
      conversationId: summary.id,
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "Hi! I can help with cover, claims, providers, pharmacy, visa requirements, rewards, updates, or forms. What would you like to do?",
      createdAt: plusSeconds(summary.startedAt, 9),
      intent: "greeting",
      latencyMs: 2_400,
      sourceIds: [],
    },
    {
      id: `${summary.id}-s3`,
      conversationId: summary.id,
      direction: "inbound",
      kind: "message",
      author: { type: "contact", name: contactName },
      body: sampleQuestions[summary.intent] ?? "Can you check my policy?",
      createdAt: plusSeconds(summary.startedAt, 240),
      intent: summary.intent,
    },
    {
      id: `${summary.id}-s4`,
      conversationId: summary.id,
      direction: "outbound",
      kind: "message",
      author: { type: "assistant", name: "Assistant" },
      body: "On it — I'll pull the answer from the OSHC knowledge base and check your policy details.",
      createdAt: plusSeconds(summary.startedAt, 271),
      intent: summary.intent,
      llmModel: "mistral-small-latest",
      latencyMs: 28_900,
      sourceIds: [`kb_${summary.intent}`],
    },
  ]
}

const sampleOpeners: Partial<Record<Intent, string>> = {
  pharmacy: "Hi, where can I get my script filled cheaper?",
  providers: "Hello, are there any direct-billing clinics near campus?",
  emergency: "I think I need urgent help.",
  student_rewards: "My rewards balance is not showing in the app.",
  waiting_periods: "How long is the waiting period for dental?",
  visa_compliance: "I need a letter for my visa renewal.",
  forms_and_guides: "Can you send the pharmacy claim form?",
}

const sampleQuestions: Partial<Record<Intent, string>> = {
  pharmacy: "Is Panadol covered under my policy?",
  providers: "Which clinics near me take direct billing?",
  emergency: "Where is the nearest hospital with my card?",
  student_rewards: "Can you check why my rewards are missing?",
  waiting_periods: "Does the waiting period apply retroactively?",
  visa_compliance: "What does the letter need to include?",
  forms_and_guides: "How do I download the claim form PDF?",
}

function plusSeconds(iso: string, seconds: number): string {
  const time = new Date(iso).getTime()
  return new Date(time + seconds * 1000).toISOString()
}

/* -------------------------------------------------------------- summaries */

export const SUMMARY_LINES: Record<string, string[]> = {
  "c-001": [
    "Ankle injury question resolved into clinic finding and claim guidance.",
    "Two knowledge-base topics cited: sport cover, direct-billing providers.",
    "No handoff requested; conversation stayed AI-handled.",
  ],
  "c-002": [
    "Claim documents discussion itemised; missing item numbers flagged.",
    "Operator handoff agreed in chat; needs review.",
  ],
}

export const SUMMARY_LINES_STUB = [
  "Session was AI-handled; no handoff was requested.",
  "Sources cited are from the OSHC knowledge base for this intent.",
]

export const RECENT_SOURCES: Record<
  string,
  { id: string; title: string; url: string }[]
> = {
  "c-001": [
    {
      id: "kb_claims_howto",
      title: "How to make a claim",
      url: "https://www.medibankoshc.com.au/claims",
    },
    {
      id: "kb_coverage_sport",
      title: "Cover for sports injuries",
      url: "https://www.medibankoshc.com.au/cover/sport",
    },
    {
      id: "kb_providers_list",
      title: "Direct-billing provider list",
      url: "https://www.medibankoshc.com.au/providers",
    },
  ],
  "c-002": [
    {
      id: "kb_claims_documents",
      title: "Documents required for GP claims",
      url: "https://www.medibankoshc.com.au/documents",
    },
  ],
}

/* --------------------------------------------------------------- overview */

const DETAIL_TOPICS: { intent: Intent; count: number }[] = [
  { intent: "coverage", count: 86 },
  { intent: "claims", count: 64 },
  { intent: "providers", count: 41 },
  { intent: "pharmacy", count: 33 },
  { intent: "visa_compliance", count: 27 },
  { intent: "reimbursements", count: 24 },
  { intent: "waiting_periods", count: 18 },
  { intent: "healthcare_navigation", count: 15 },
  { intent: "student_rewards", count: 12 },
  { intent: "medicines", count: 9 },
  { intent: "updates", count: 8 },
  { intent: "forms_and_guides", count: 7 },
  { intent: "support", count: 5 },
  { intent: "greeting", count: 4 },
  { intent: "unknown", count: 6 },
  { intent: "emergency", count: 2 },
]

/* ------------------------------------------------------------- snapshots */

const TOTAL_INTENTS = DETAIL_TOPICS.reduce((sum, topic) => sum + topic.count, 0)

const INTENT_MIX: IntentSlice[] = DETAIL_TOPICS.map((topic) => ({
  intent: topic.intent,
  label: INTENT_LABEL[topic.intent],
  count: topic.count,
  sharePct: Math.round((topic.count / TOTAL_INTENTS) * 100),
}))

function timelineFor(range: RangeId): TimelinePoint[] {
  if (range === "24h") return TIMELINE_24H
  if (range === "7d") return TIMELINE_7D
  return TIMELINE_30D
}

const TIMELINE_7D: TimelinePoint[] = [
  { label: "11 Oct", inbound: 40, outbound: 55 },
  { label: "12 Oct", inbound: 37, outbound: 46 },
  { label: "13 Oct", inbound: 42, outbound: 58 },
  { label: "14 Oct", inbound: 51, outbound: 67 },
  { label: "15 Oct", inbound: 56, outbound: 71 },
  { label: "16 Oct", inbound: 53, outbound: 64 },
  { label: "17 Oct", inbound: 58, outbound: 66 },
]

const TIMELINE_24H: TimelinePoint[] = [
  { label: "00:00", inbound: 6, outbound: 9 },
  { label: "02:00", inbound: 4, outbound: 8 },
  { label: "04:00", inbound: 3, outbound: 5 },
  { label: "06:00", inbound: 8, outbound: 12 },
  { label: "08:00", inbound: 17, outbound: 24 },
  { label: "10:00", inbound: 24, outbound: 33 },
  { label: "12:00", inbound: 26, outbound: 35 },
  { label: "14:00", inbound: 30, outbound: 42 },
  { label: "16:00", inbound: 28, outbound: 40 },
  { label: "18:00", inbound: 19, outbound: 28 },
  { label: "20:00", inbound: 11, outbound: 18 },
  { label: "22:00", inbound: 7, outbound: 12 },
]

const TIMELINE_30D: TimelinePoint[] = []
for (let index = 0; index < 30; index += 1) {
  const day = new Date(Date.UTC(2026, 8, 18) + index * 86_400_000)
  const weekday = day.getUTCDay()
  const weekendDrop = weekday === 0 || weekday === 6 ? 0.55 : 1
  const wobble = Math.abs(Math.sin((index + 3) * 1.7))
  const inbound = Math.max(4, Math.round((26 + wobble * 18) * weekendDrop))
  const outbound = Math.round(inbound * 1.22)
  TIMELINE_30D.push({
    label: `${day.getUTCDate()} ${day.toLocaleString("en-AU", { month: "short", timeZone: "UTC" })}`,
    inbound,
    outbound,
  })
}

const LANG_BREAKDOWN: ShareSlice[] = [
  { id: "en", label: "English", count: 264, sharePct: 68 },
  { id: "zh", label: "简体中文", count: 84, sharePct: 22 },
  { id: "es", label: "Español", count: 39, sharePct: 10 },
]

const ERROR_BREAKDOWN: ShareSlice[] = [
  { id: "rate-limited", label: "Rate limited", count: 6, sharePct: 40 },
  { id: "llm-timeout", label: "LLM timeout", count: 4, sharePct: 27 },
  { id: "invalid-input", label: "Invalid input", count: 3, sharePct: 20 },
  { id: "delivery-failed", label: "Delivery failed", count: 2, sharePct: 13 },
]

const STATUS_BREAKDOWN: StatusFixture[] = [
  { status: "new", count: 5 },
  { status: "in_progress", count: 9 },
  { status: "awaiting_contact", count: 6 },
  { status: "needs_review", count: 3 },
  { status: "resolved", count: 31 },
  { status: "failed", count: 2 },
]

interface StatusFixture {
  status: ConversationSummary["status"]
  count: number
}

const PEAK_WINDOWS_7D = [
  {
    windowLabel: "Fri 14:00–16:00",
    detail: "56 inbound messages — coverage and claims dominate.",
  },
  {
    windowLabel: "Wed 09:00–11:00",
    detail: "44 inbound — visa questions ahead of semester intake.",
  },
]

const PEAK_WINDOWS_30D = [
  {
    windowLabel: "Fridays 13:00–17:00",
    detail: "Consistent spike across all 4 Fridays in range.",
  },
  {
    windowLabel: "First week of month",
    detail: "Claim and reimbursement volume rises ahead of quotas.",
  },
]

const PEAK_WINDOWS_24H = [
  {
    windowLabel: "14:00–16:00 today",
    detail: "58 inbound in two hours; lunchtime claim questions.",
  },
]

function kpisFor(range: RangeId): OverviewSnapshot["kpis"] {
  if (range === "24h") {
    return [
      {
        id: "total-enquiries",
        label: "Total enquiries",
        value: 183,
        unit: "count",
        changePct: 12,
        betterWhen: "up",
        hint: "All inbound enquiries, severity agnostic.",
      },
      {
        id: "new-enquiries",
        label: "New enquiries",
        value: 24,
        unit: "count",
        changePct: 8,
        betterWhen: "up",
        hint: "First contact in the window.",
      },
      {
        id: "open-conversations",
        label: "Open conversations",
        value: 18,
        unit: "count",
        changePct: -6,
        betterWhen: "down",
        hint: "Awaiting reply, in progress, or for review.",
      },
      {
        id: "avg-first-response",
        label: "Avg first response",
        value: 870_000,
        unit: "ms",
        changePct: -9,
        betterWhen: "down",
        hint: "Time from inbound to first assistant reply.",
      },
      {
        id: "ai-resolution-rate",
        label: "AI resolution rate",
        value: 71,
        unit: "pct",
        changePct: 2,
        betterWhen: "up",
        hint: "Conversations the assistant closed without handoff.",
      },
      {
        id: "handoff-rate",
        label: "Handoff rate",
        value: 9,
        unit: "pct",
        changePct: -1,
        betterWhen: "down",
        hint: "Conversations escalated to a human agent.",
      },
      {
        id: "failed-conversations",
        label: "Failed conversations",
        value: 1,
        unit: "count",
        changePct: 0,
        betterWhen: "down",
        hint: "Delivery failure, rate limit, or fallback.",
      },
      {
        id: "csat",
        label: "Satisfaction (CSAT)",
        value: null,
        unit: "pct",
        changePct: null,
        betterWhen: "up",
        hint: "No post-conversation survey is wired up yet.",
      },
    ]
  }
  if (range === "7d") {
    return [
      {
        id: "total-enquiries",
        label: "Total enquiries",
        value: 312,
        unit: "count",
        changePct: 18,
        betterWhen: "up",
        hint: "All inbound enquiries, severity agnostic.",
      },
      {
        id: "new-enquiries",
        label: "New enquiries",
        value: 61,
        unit: "count",
        changePct: 14,
        betterWhen: "up",
        hint: "First contact in the window.",
      },
      {
        id: "open-conversations",
        label: "Open conversations",
        value: 21,
        unit: "count",
        changePct: -4,
        betterWhen: "down",
        hint: "Awaiting reply, in progress, or for review.",
      },
      {
        id: "avg-first-response",
        label: "Avg first response",
        value: 840_000,
        unit: "ms",
        changePct: -7,
        betterWhen: "down",
        hint: "Time from inbound to first assistant reply.",
      },
      {
        id: "ai-resolution-rate",
        label: "AI resolution rate",
        value: 68,
        unit: "pct",
        changePct: 3,
        betterWhen: "up",
        hint: "Conversations the assistant closed without handoff.",
      },
      {
        id: "handoff-rate",
        label: "Handoff rate",
        value: 11,
        unit: "pct",
        changePct: -4,
        betterWhen: "down",
        hint: "Conversations escalated to a human agent.",
      },
      {
        id: "failed-conversations",
        label: "Failed conversations",
        value: 4,
        unit: "count",
        changePct: 100,
        betterWhen: "down",
        hint: "Delivery failure, rate limit, or fallback.",
      },
      {
        id: "csat",
        label: "Satisfaction (CSAT)",
        value: null,
        unit: "pct",
        changePct: null,
        betterWhen: "up",
        hint: "No post-conversation survey is wired up yet.",
      },
    ]
  }
  return [
    {
      id: "total-enquiries",
      label: "Total enquiries",
      value: 1_048,
      unit: "count",
      changePct: 22,
      betterWhen: "up",
      hint: "All inbound enquiries, severity agnostic.",
    },
    {
      id: "new-enquiries",
      label: "New enquiries",
      value: 208,
      unit: "count",
      changePct: 15,
      betterWhen: "up",
      hint: "First contact in the window.",
    },
    {
      id: "open-conversations",
      label: "Open conversations",
      value: 34,
      unit: "count",
      changePct: 9,
      betterWhen: "down",
      hint: "Awaiting reply, in progress, or for review.",
    },
    {
      id: "avg-first-response",
      label: "Avg first response",
      value: 900_000,
      unit: "ms",
      changePct: 4,
      betterWhen: "down",
      hint: "Time from inbound to first assistant reply.",
    },
    {
      id: "ai-resolution-rate",
      label: "AI resolution rate",
      value: 66,
      unit: "pct",
      changePct: 1,
      betterWhen: "up",
      hint: "Conversations the assistant closed without handoff.",
    },
    {
      id: "handoff-rate",
      label: "Handoff rate",
      value: 12,
      unit: "pct",
      changePct: 2,
      betterWhen: "down",
      hint: "Conversations escalated to a human agent.",
    },
    {
      id: "failed-conversations",
      label: "Failed conversations",
      value: 13,
      unit: "count",
      changePct: 44,
      betterWhen: "down",
      hint: "Delivery failure, rate limit, or fallback.",
    },
    {
      id: "csat",
      label: "Satisfaction (CSAT)",
      value: null,
      unit: "pct",
      changePct: null,
      betterWhen: "up",
      hint: "No post-conversation survey is wired up yet.",
    },
  ]
}

export function overviewFor(range: RangeId): OverviewSnapshot {
  const timeline = timelineFor(range)
  const direction = timeline.reduce(
    (acc, point) => ({
      inbound: acc.inbound + point.inbound,
      outbound: acc.outbound + point.outbound,
    }),
    { inbound: 0, outbound: 0 },
  )
  const statusTotal = STATUS_BREAKDOWN.reduce((sum, s) => sum + s.count, 0)
  return {
    range,
    generatedAt: MOCK_NOW,
    kpis: kpisFor(range),
    timeline,
    intents: INTENT_MIX,
    statuses: STATUS_BREAKDOWN.map((s) => ({
      status: s.status,
      count: s.count,
      sharePct: Math.round((s.count / statusTotal) * 100),
      label: STATUS_LABEL[s.status],
    })),
    languages: LANG_BREAKDOWN,
    direction,
    errors: ERROR_BREAKDOWN,
    peakTimes:
      range === "24h"
        ? PEAK_WINDOWS_24H
        : range === "7d"
          ? PEAK_WINDOWS_7D
          : PEAK_WINDOWS_30D,
  }
}

/* --------------------------------------------------------------- triggers */

export const TRIGGERS: TriggerDefinition[] = [
  {
    id: "quiz",
    name: "Start quiz session",
    description:
      "Delivers the OSHC quiz to a contact by phone number. Validates E.164, rate-limits to 5 starts per minute per contact, and resumes an active session instead of starting a new one.",
    intendedUse: "Kick off a weekly quiz for one student.",
    backendNote:
      "Maps to tirp-server POST /quiz/start (Bearer token). A browser cannot hold the trigger token, so Phase 3 should proxy this through a dashboard API with server-side auth.",
    availability: "available",
    availabilityNote:
      "Live endpoint exists (POST /quiz/start) but the console has no authenticated proxy yet, so a run reports the exact missing dependency instead of sending anything.",
    fields: [
      {
        id: "phone",
        kind: "phone",
        label: "Contact phone number",
        description: "E.164 format such as +61412345620.",
        required: true,
      },
    ],
  },
  {
    id: "catalogue-flow",
    name: "Send catalogue flow",
    description:
      "Replays the OSHC service catalogue flow over WhatsApp, useful when a contact lost their catalogue screen mid-flow.",
    intendedUse: "Bring someone back into the service catalogue.",
    backendNote:
      "Requires KAPSO_API_KEY, KAPSO_PHONE_NUMBER_ID, and OSHC_FLOW_ID; Kapso sendFlow is the real deliveries channel.",
    availability: "needs_config",
    availabilityNote: "Needs OSHC_FLOW_ID; not yet reachable from the console.",
    fields: [
      {
        id: "phone",
        kind: "phone",
        label: "Contact phone number",
        description: "E.164 format such as +61498331177.",
        required: true,
      },
    ],
  },
  {
    id: "follow-up",
    name: "Send follow-up message",
    description:
      "Sends a one-off operator-written message to a contact through the dashboard while the assistant stays quiet.",
    intendedUse: "Chase a claim document or missing receipt.",
    backendNote:
      "Would use sendFormattedText. Needs a dashboard operator endpoint.",
    availability: "coming_soon",
    availabilityNote:
      "No operator endpoint exists yet; the flow is designed but hidden until the API ships.",
    fields: [
      {
        id: "phone",
        kind: "phone",
        label: "Contact phone number",
        description: "E.164 format such as +61455042891.",
        required: true,
      },
      {
        id: "message",
        kind: "text",
        label: "Message body",
        description: "Plain text; sent as-is.",
        required: true,
        maxLength: 4000,
      },
    ],
  },
  {
    id: "escalate",
    name: "Escalate conversation",
    description:
      "Hands a conversation to the human support desk and stops AI replies until resolution.",
    intendedUse:
      "Human takeover when the assistant hits its limits or the contact asks for a person.",
    backendNote:
      "Requires an operator endpoint to mark handling mode and notify the desk.",
    availability: "coming_soon",
    availabilityNote: "Blocked on Phase 3 operator API.",
    fields: [
      {
        id: "conversation",
        kind: "conversation",
        label: "Conversation",
        description: "Pick an open conversation.",
        required: true,
      },
    ],
  },
]

export const EXECUTIONS: TriggerExecution[] = [
  {
    id: "e-9002",
    triggerId: "quiz",
    triggerName: "Start quiz session",
    status: "success",
    operator: "dashboard",
    target: "+614•• ••• 740",
    conversationId: "c-008",
    startedAt: "2026-10-16T22:05:11Z",
    durationMs: 1_802,
    sync: "server",
    result: {
      reference: "session #4411 · delivery=flow",
      detail:
        "Quiz session for a returning contact; the flow delivered on schedule.",
    },
  },
  {
    id: "e-9001",
    triggerId: "quiz",
    triggerName: "Start quiz session",
    status: "failed",
    operator: "dashboard",
    target: "+614•• ••• 218",
    startedAt: "2026-10-16T21:58:40Z",
    durationMs: 412,
    sync: "server",
    error: {
      code: "rate_limited",
      message: "5 quiz starts in one minute for this contact. Try again later.",
    },
  },
  {
    id: "e-9000",
    triggerId: "catalogue-flow",
    triggerName: "Send catalogue flow",
    status: "rejected",
    operator: "dashboard",
    target: "+614•• ••• 289",
    startedAt: "2026-10-15T14:22:09Z",
    durationMs: 88,
    sync: "server",
    error: {
      code: "unsupported",
      message:
        "OSHC_FLOW_ID is not configured on the server; nothing was sent.",
    },
  },
]
