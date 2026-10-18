# tirp-dashboard

The frontend for the TIRP conversations console — a place to watch and review
the WhatsApp conversations handled by [`tirp-server`](../tirp-server).

The dashboard can run against deterministic fixtures or the authenticated
`tirp-server` dashboard API. See [`.env.example`](./.env.example) and the
workflow below before connecting a tunnel or Kapso.

## Quick start

```bash
bun install
bun run check
bun run dev
```

Then open http://localhost:3000.

## What's here

- **TanStack Start** app with file-based routing (`src/routes`).
- **Design system** — tokens in `src/styles.css`, shadcn/ui primitives in
  `src/components/ui`, product primitives in `src/components/app`.
- **A living showcase** at `/design-system` covering colour, type, buttons,
  forms, tables, charts, overlays, states, motion, accessibility, and
  responsive behaviour.
- **Theme** — light, dark, and system, with no flash on load.
- **Docs** — `DESIGN.md` for the system and its rules, `CLAUDE.md` for agent and
  contributor context.

## Scripts

| Command                   | What it does                     |
| ------------------------- | -------------------------------- |
| `bun run dev`             | Dev server on port 3000          |
| `bun run build`           | Production build                 |
| `bun run preview`         | Preview the production build     |
| `bun run typecheck`       | Type-check with `tsc`            |
| `bun run format`          | Format with Prettier             |
| `bun run check`           | Type-check and verify formatting |
| `bun run generate-routes` | Regenerate the route tree        |

## Adding things

- **A page:** create `src/routes/<name>.tsx`, add a `PageHeader`, register it in
  `src/lib/navigation.ts`.
- **A component:** check `components/ui` and `components/app` first, then
  `bunx --bun shadcn@latest add <name>` or compose a new `components/app`
  primitive.
- **A token:** add it for light and dark in `src/styles.css`, map it in
  `@theme inline`, then use the utility.

Full guidance lives in [`DESIGN.md`](./DESIGN.md).

## Working with tirp-server

Run the two applications as separate processes. Keep the ports distinct:

```text
dashboard:  http://localhost:3000
server:     http://localhost:8787
```

### 1. Configure the server

From `tirp-server/`:

```bash
cp .env.example .env
```

Set the database, Kapso, AI, and dashboard operator values. For local HTTP,
use:

```env
PORT=8787
DASHBOARD_ALLOWED_ORIGINS=http://localhost:3000
DASHBOARD_COOKIE_SECURE=false
```

For a tunnel or HTTPS deployment, use the real dashboard origin and set
`DASHBOARD_COOKIE_SECURE=true`, for example:

```env
DASHBOARD_ALLOWED_ORIGINS=https://dashboard.example.com
DASHBOARD_COOKIE_SECURE=true
DASHBOARD_COOKIE_SAMESITE=None
```

`DASHBOARD_COOKIE_SAMESITE=None` is required when the dashboard and API are
on different sites, such as a dashboard on `localhost:3000` calling a
`trycloudflare.com` API. It requires HTTPS and secure cookies. Keep `Lax` for
same-site local development.

Keep the operator password and provider secrets only in the server `.env`.
They must never be copied into the frontend environment.

### 2. Configure the dashboard

From `tirp-dashboard/`:

```bash
cp .env.example .env.local
```

For local development:

```env
VITE_DASHBOARD_ADAPTER=http
VITE_DASHBOARD_API_BASE=http://localhost:8787
```

For a tunneled backend:

```env
VITE_DASHBOARD_ADAPTER=http
VITE_DASHBOARD_API_BASE=https://api.example.com
```

`VITE_*` values are bundled by Vite. Restart the dashboard dev server or
rebuild after changing them.

### 3. Start in this order

```bash
# Terminal 1
cd tirp-server
npm run dev # or the server's existing development command

# Terminal 2
cd tirp-dashboard
bun run dev
```

The server must be running before the dashboard can restore a session or load
data. Sign in with `DASHBOARD_OPERATOR_EMAIL` and
`DASHBOARD_OPERATOR_PASSWORD`.

### 4. Use a Cloudflare Tunnel

Expose the server, not the dashboard API through a second unrelated hostname:

```bash
cloudflared tunnel --url http://localhost:8787
```

Set the tunnel hostname as `VITE_DASHBOARD_API_BASE`, configure the dashboard
origin in `DASHBOARD_ALLOWED_ORIGINS`, and use HTTPS cookie settings. Configure
Kapso's webhook URL as:

```text
https://api.example.com/webhooks/kapso
```

After changing the tunnel hostname, update both the frontend build-time API
base and the server's allowed origin if the dashboard origin changed.

### 5. Keep both sides synchronized

When changing an API contract:

1. Update the server route/schema/serializer first.
2. Update the HTTP adapter mapping in `src/lib/api/http-adapter.ts`.
3. Update shared frontend types in `src/lib/api/types.ts`.
4. Update the mock adapter so offline development remains type-compatible.
5. Update `src/lib/api/README.md` with the request and response shape.
6. Run checks in both projects:

   ```bash
   cd tirp-server && npx tsc --noEmit && npx vitest run
   cd ../tirp-dashboard && bun run check && bun run build
   ```

7. Restart both processes when environment variables, migrations, or Vite
   configuration changes.

For webhook or delivery changes, test the public tunnel URL with Kapso and
inspect the server logs; the browser only exercises `/dashboard/*` endpoints.

## Requirements

- [Bun](https://bun.sh) 1.3+

## Roadmap

1. **Foundation and design system** — done.
2. **Dashboard UI** — conversation list, detail view, search, filters.
3. **Server integration** — conversation APIs in `tirp-server`, pagination,
   live updates.
