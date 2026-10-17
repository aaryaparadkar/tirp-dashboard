# tirp-dashboard

The frontend for the TIRP conversations console — a place to watch and review
the WhatsApp conversations handled by [`tirp-server`](../tirp-server).

This is **Phase 1**: the application is scaffolded and the design system is in
place. Conversation data arrives in Phase 2 (UI) and Phase 3 (server
integration).

## Quick start

```bash
bun install
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

## Requirements

- [Bun](https://bun.sh) 1.3+

## Roadmap

1. **Foundation and design system** — done.
2. **Dashboard UI** — conversation list, detail view, search, filters.
3. **Server integration** — conversation APIs in `tirp-server`, pagination,
   live updates.
