# Dashboard API

The console talks to **tirp-server** through a single `DashboardAdapter`
(`src/lib/api/dashboard.ts`). Two implementations exist:

- **`mockAdapter`** (default): deterministic fixtures in `mock-data.ts`. Reads
  are real-shaped; every state-changing call rejects with the structured
  `unsupported` error instead of faking success.
- **HTTP adapter** (`src/lib/api/http-adapter.ts`): the real `/dashboard/*`
  endpoints, selected with an environment variable.

```bash
# .env / .env.local
VITE_DASHBOARD_ADAPTER=http
VITE_DASHBOARD_API_BASE=          # empty = same origin (proxied to tirp-server)
```

`initialiseDashboardAdapter()` (called from `src/routes/__root.tsx`) installs
the adapter before any view reads data. Routes and components never choose an
implementation — they call through `getDashboardAdapter()` and the standalone
mutation helpers.

## Authentication

Operator sessions, not a browser-held token:

1. `POST /dashboard/auth/login` with `{ email, password }` sets an `HttpOnly`,
   `SameSite=Lax` session cookie and returns
   `{ operator, csrfToken, expiresAt }`.
2. `GET /dashboard/auth/session` restores the session on reload.
3. Every mutation sends the `x-csrf-token` header (double submit) and a same
   `Origin`/`Referer`; failures return `forbidden`.
4. `POST /dashboard/auth/logout` clears the cookie.

The `AuthGate` (`src/components/app/auth-gate.tsx`) blocks the shell until the
session resolves and renders the sign-in screen when anonymous. In mock mode
the gate is bypassed. A `401` from any request drops the session back to the
sign-in screen.

## Shared error shape

```json
{
  "error": {
    "code": "unauthorized | forbidden | not_found | validation | conflict | rate_limited | unsupported | unavailable | network | internal",
    "message": "Operator-safe sentence",
    "status": 429,
    "retry_after": 12
  }
}
```

`src/lib/api/http.ts` normalizes every non-2xx response (and network failures)
into a `DashboardApiError` with the same code set, so views render one error
type regardless of transport.

## Endpoints

| Method | Path                                                                                                                  | Used by            | Shape / notes                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/dashboard/auth/login`                                                                                               | Sign-in            | `{ email, password }` → `{ operator, csrfToken, expiresAt }` + session cookie                                                                                |
| GET    | `/dashboard/auth/session`                                                                                             | Session restore    | `{ operator, csrfToken, expiresAt }`                                                                                                                         |
| POST   | `/dashboard/auth/logout`                                                                                              | Sign out           | Clears the cookie                                                                                                                                            |
| GET    | `/dashboard/overview?range=24h\|7d\|30d`                                                                              | Overview page      | KPIs, timeline, intent/status/language/error splits, peak windows; `ETag` + 304 revalidation                                                                 |
| GET    | `/dashboard/conversations?page=&page_size=&q=&status=&intent=&language=&direction=&handling=&has_error=&range=&sort=` | Conversations list | `page_size` capped at 50; returns `{ data, page, page_size, total, total_pages, generated_at }`                                                              |
| GET    | `/dashboard/conversations/:id`                                                                                        | Detail + thread    | `{ summary, messages, summaryLines, recentSources }`                                                                                                         |
| POST   | `/dashboard/conversations/:id/reply`                                                                                  | Reply composer     | `{ body, clientTag }`; persists before sending; `201 { message }`. On provider failure returns the stored message + `unavailable` so the draft is never lost |
| PATCH  | `/dashboard/conversations/:id`                                                                                        | Status change      | `{ status }` → `{ summary }`; illegal transitions return `conflict`                                                                                          |
| POST   | `/dashboard/conversations/:id/escalate`                                                                               | Escalate action    | `{ note? }` → `{ summary, notified, partialError? }`; desk-notify failure is reported as partial, never as success                                           |
| PATCH  | `/dashboard/conversations/:id/intent`                                                                                 | Category change    | `{ intent }` → `{ summary }`                                                                                                                                 |
| GET    | `/dashboard/triggers`                                                                                                 | Triggers page      | `{ data: TriggerDefinition[] }` with availability derived from server config                                                                                 |
| POST   | `/dashboard/triggers/:id/run`                                                                                         | Trigger run dialog | `{ phone?, message?, conversationId?, idempotencyKey? }` → `{ execution }`; the raw phone is hashed, only a masked target is stored                          |
| GET    | `/dashboard/trigger-executions?page=&page_size=&trigger_id=&status=&conversation_id=`                                 | Execution history  | `{ data, page, page_size, total, total_pages }`, newest first                                                                                                |

## Field-level notes

- **Statuses** map to `ConversationStatus` in `src/lib/api/types.ts`; the UI
  keeps status colour-plus-label (`STATUS_TONE`/`STATUS_LABEL`).
- **Intents** match `tirp-server`'s `Intent` union exactly.
- **Relative labels** derive from each response's `generated_at` /
  `summary.generatedAt` — never from `Date.now()` — so renders stay stable.
- **Phones** are masked server-side; the browser only ever receives
  `contact.maskedPhone`. Raw numbers are never persisted to storage or logged.
- **Idempotency**: a retried reply reuses its `clientTag` (unique per
  conversation); a retried trigger run reuses its `idempotencyKey`. The server
  is a no-op on the duplicate and returns the existing record.
- **CSAT** is returned as `null` (no survey is wired up) rather than `0`.

## Server-side rules (enforced)

1. Reuse `normalizePhone()` for any operator-supplied number.
2. Rate-limit per operator **and** per target through the shared store
   (`dashboard_rate_limits`), degrading to the in-memory limiter if the store
   is unavailable.
3. Every conversation turn records `channel` / `author_type`, so operator
   replies are distinguishable from assistant turns.
4. List responses redact previews to the first sentence; full bodies appear
   only in the conversation detail read.
5. Responses carry security headers (`nosniff`, `DENY`, a strict CSP) and only
   echo CORS origins listed in `DASHBOARD_ALLOWED_ORIGINS`.
