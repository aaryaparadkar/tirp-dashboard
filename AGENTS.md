# tirp-dashboard

The frontend for the TIRP conversations console. Watches and reviews the
WhatsApp conversations handled by `tirp-server`.

Read `DESIGN.md` before building any UI. It defines the tokens, components, and
the accessibility, responsive, and engineering rules this project follows.

## Stack

TanStack Start (React 19 + TanStack Router) · Tailwind CSS v4 · shadcn/ui
(`radix-nova`) · `cn` for class merging · lucide-react · IBM Plex (self-hosted
via Fontsource) · Recharts · sonner · Bun.

## Commands

Run with Bun, not npm or node.

- `bun run dev` — dev server on http://localhost:3000
- `bun run build` — production build
- `bun run typecheck` — `tsc --noEmit`
- `bun run format` — Prettier (includes Tailwind class sorting)
- `bun run check` — typecheck + format check
- `bun run generate-routes` — regenerate `src/routeTree.gen.ts` after adding routes
- `bunx --bun shadcn@latest add <component>` — add a shadcn component

## Layout

- `src/routes/` — file-based routes (`__root.tsx`, `index.tsx`,
  `conversations.tsx`, `triggers.tsx`, `design-system.tsx`)
- `src/components/ui/` — shadcn primitives; keep close to upstream
- `src/components/app/` — product primitives (AppShell, PageHeader, StatCard, …)
- `src/components/overview/`, `conversations/`, `triggers/` — page sections
- `src/lib/api/` — typed data layer (adapter, fixtures, Phase 3 contract)
- `src/components/design-system/` — the showcase rendered at `/design-system`
- `src/lib/` — `utils.ts` (cn), `theme.ts`, `format.ts`, `navigation.ts`
- `src/hooks/` — `use-theme`, `use-mobile`
- `src/styles.css` — design tokens; the only global stylesheet

## Rules

- Import app code through `@/*`. There is no other alias.
- Use semantic tokens (`bg-background`, `text-muted-foreground`, `bg-primary`).
  Never raw colour values and never manual `dark:` colour overrides.
- Use `gap-*`, not `space-x-*` / `space-y-*`. Use `size-*` for squares.
- Use `cn()` for conditional classes.
- Compose existing components before writing markup (`Alert`, `Empty`, `Badge`,
  `Separator`, `Skeleton`, `Card`). Give every overlay a title.
- Every data view implements loading, empty, and error states.
- Never rely on colour alone to convey status.
- Keep the shell's landmarks and one `<h1>` per route.
- Do not edit `components/ui/*` except for theme integration.
- Do not persist conversation content (message bodies, phone numbers) to
  localStorage, cookies, or the console.

## Dev notes

- TanStack Devtools (`@tanstack/devtools-vite` + `@tanstack/react-devtools`) is
  intentionally not installed. Its source annotation (`data-tsd-source`) and
  server-to-client console forwarding produced false hydration mismatches on
  Radix inputs and a runaway `console.error` loop. Do not re-add without
  verifying the browser console stays clean on `/` and `/design-system`.
- Keep the dev console clean. A hydration warning or React error in dev is a
  bug to fix, not noise to ignore.

## Backend

`tirp-server` (sibling directory) owns WhatsApp data and exposes it over HTTP.
Phase 3 adds authenticated conversation APIs; the dashboard reads them through
typed client functions in `src/lib`.

## Status

- Phase 1 — scaffold, design system, docs: done.
- Phase 2 — Overview, conversation list + detail (`?c=` deep links, search,
  filters, load-more pagination), reply composer with honest failure states,
  trigger cards grouped by availability, run dialog with E.164 validation,
  execution history: done. Reads run on the mock adapter (`src/lib/api`,
  deterministic fixtures); sends, status/category/escalation changes, and
  trigger runs report the structured Phase 3 error instead of simulating
  success. Phones masked; no conversation content persisted.
- Phase 3 — server integration: swap the HTTP adapter in via
  `setDashboardAdapter()`, add pagination/live updates.
