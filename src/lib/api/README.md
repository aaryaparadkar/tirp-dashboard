# Dashboard API contract (Phase 3)

The dashboard runs against deterministic fixtures until these endpoints
exist in **tirp-server**. Every mutating affordance in the UI already calls
through `DashboardAdapter` (`src/lib/api/dashboard.ts`) and, when the call is
not yet possible, renders the structured `unsupported` error from this file
instead of a simulated success. The HTTP adapter replaces the mock wholesale
via `setDashboardAdapter()` — routes and components do not change.

All endpoints are authenticated (operator session or machine token), answered
with the shared error shape, and rate limited. Phone numbers may be accepted
in requests but must never appear in shared caches or logs; responses return
masked numbers.

## Shared error shape

```json
{
  "error": {
    "code": "unauthorized | forbidden | rate_limited | not_found | validation | unavailable | unsupported | network",
    "message": "Operator-safe sentence",
    "status": 429
  }
}
```

## Endpoints

| Method | Path                                                                                                                  | Used by                        | Notes                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/overview?range=24h\|7d\|30d`                                                                              | Overview page                  | KPIs, timeline, intent mix, status counts, language split, direction split, error split, peak windows                                         |
| GET    | `/dashboard/conversations?page=&page_size=&q=&status=&intent=&language=&direction=&handling=&has_error=&range=&sort=` | Conversations list             | Capped `page_size` (max 50), returns `{ data, page, page_size, total, total_pages }`                                                          |
| GET    | `/dashboard/conversations/:id`                                                                                        | Conversation detail + messages | Single call returns `{ summary, messages, summaryLines, recentSources }`                                                                      |
| POST   | `/dashboard/conversations/:id/reply`                                                                                  | Reply composer                 | Body `{ body: string }`; server validates, checks rate limits, sends via Kapso `sendFormattedText`, logs a `manual-agent` turn via `saveTurn` |
| PATCH  | `/dashboard/conversations/:id`                                                                                        | Status change                  | Body `{ status }`; writes through to the conversation record                                                                                  |
| POST   | `/dashboard/conversations/:id/escalate`                                                                               | Escalate action                | Body `{ note? }`; flips handling mode, notifies the desk                                                                                      |
| PATCH  | `/dashboard/conversations/:id/intent`                                                                                 | Category change                | Body `{ intent }` (server taxonomomy enum)                                                                                                    |
| GET    | `/dashboard/triggers`                                                                                                 | Triggers page                  | Definitions with availability + required fields                                                                                               |
| POST   | `/dashboard/triggers/:id/run`                                                                                         | Trigger run dialog             | Runs server-side with existing Kapso primitives; the browser never sees `KAPSO_API_KEY` / `QUIZ_TRIGGER_TOKEN`                                |
| GET    | `/dashboard/trigger-executions?page=`                                                                                 | Execution history              | New entries first, `sync` flag distinguishing server log vs local record                                                                      |

## Field-level notes

- **Statuses** map to `ConversationStatus` in `src/lib/api/types.ts`; the
  summary card keeps them colour-plus-label (`STATUS_TONE`/`STATUS_LABEL`).
- **Intents** must match `tirp-server`'s `Intent` union exactly
  (`INTENTS` in types.ts) — the detailed breakdowns reuse it.
- **Latency**: return per-message `latencyMs`; the overview aggregates p50
  and the change versus the previous equal-length window.
- **Messages**: cursor or offset pagination is acceptable; the UI currently
  renders the full thread from `GET /dashboard/conversations/:id`.
- **Optimistic sends** keep the same `clientTag` the browser generates so a
  rejection can pair the failed message with its retry.

## Data integrity rules for the server

1. Never trust phone input; reuse `normalizePhone()` from `api.ts`.
2. Rate-limit each mutating endpoint per token _and_ per target.
3. `saveTurn` gains `channel: "operator"` (or reuse `message_type`) so
   operator replies are distinguishable from assistant turns.
4. Return masked phones (`+61 ••• ••• 620`) and redact message previews to
   the first sentence in list responses; full bodies only in the detail view.
