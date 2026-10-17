# TIRP Dashboard — Design System

The shared visual and interaction language for the conversations dashboard.
Read this before building a screen. If a pattern you need is missing, add it
here first, then use it.

The design system is a "calm operations console for human conversations":
quiet surfaces, colour that carries meaning, and density where operators need
it. It is deliberately not a copy of WhatsApp's consumer interface.

---

## 1. Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | TanStack Start (React 19, file-based routes)        |
| Styling        | Tailwind CSS v4 (CSS-first config, no JS config)    |
| Components     | shadcn/ui (`radix-nova` style, radix primitives)    |
| Class merging  | `cn` (shadcn's clsx + tailwind-merge engine)        |
| Icons          | `lucide-react`                                      |
| Fonts          | IBM Plex Sans Variable, IBM Plex Mono (self-hosted) |
| Charts         | Recharts via the shadcn `chart` wrapper             |
| Toasts         | `sonner`                                            |
| Package runner | Bun                                                 |

The single global stylesheet is `src/styles.css`. It is also the shadcn CSS
target (see `components.json`).

---

## 2. Project structure

```
src/
├── components/
│   ├── ui/               shadcn primitives (generated; avoid hand-editing)
│   ├── app/              product primitives composed from ui/ (+ RangeSelect,
│   │                     DemoDataNote, KPI cards, EmptyState, ErrorState…)
│   ├── overview/         Overview-page cards (charts, share rows, recent list)
│   ├── conversations/    list, filters, timeline, composer, detail, actions
│   ├── triggers/         trigger cards, run dialog, execution history
│   └── design-system/    the showcase at /design-system
├── hooks/                use-theme, use-mobile, use-dashboard-query,
│                         use-mounted, use-debounced-value
├── lib/
│   ├── utils.ts          cn()
│   ├── format.ts         deterministic formatters, maskPhone, relative labels
│   ├── theme.ts          theme model + pre-paint script
│   ├── navigation.ts     nav config + app name
│   └── api/              typed data layer: types.ts, mock-data.ts,
│                         dashboard.ts (adapter + Phase 3 contract in README)
├── routes/               file-based routes (__root, index, conversations,
│                         triggers, design-system)
├── styles.css            design tokens + Tailwind theme mapping
└── router.tsx            router factory
```

Rule of thumb: `components/ui` is generic and token-driven. `components/app`
is where product-specific composition lives. Page-specific sections live in
`components/<page-name>/`. All reads go through `getDashboardAdapter()`; no
component fetches by itself.

Rule of thumb: `components/ui` is generic and token-driven. `components/app`
is where product-specific composition lives.

---

## 3. Tokens

Tokens live in `src/styles.css` as CSS variables, mapped to Tailwind utilities
through the `@theme inline` block. **Components use utilities, never raw colour
values.**

Use `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`,
and so on. Never `bg-blue-500`, never `#0d9488`.

### Colour

Semantic tokens, each defined for light and dark:

- **Surfaces** — `background`, `card`, `popover`, `muted`, `accent`, `secondary`
  (each with a matching `-foreground`)
- **Interactive** — `primary`, `ring`, `border`, `input`
- **Status** — `destructive`, `success`, `warning`, `info` (each with a
  `-foreground`)
- **Soft status** — `*-soft` and `*-soft-foreground` pairs for tinted surfaces
  with guaranteed text contrast
- **Data** — `chart-1` … `chart-5`
- **Sidebar** — `sidebar`, `sidebar-foreground`, `sidebar-accent`,
  `sidebar-border`, `sidebar-ring`, …

The brand primary is a deep teal. It signals trust and communication without
impersonating WhatsApp green.

Every status colour has a paired foreground. Never place text on a solid token
without using its `-foreground`; never tint a surface without using its
`-soft-foreground`.

### Typography

- **Sans** (`--font-sans`): IBM Plex Sans Variable — all interface text.
- **Mono** (`--font-mono`): IBM Plex Mono — phone numbers, IDs, timestamps,
  latency, counts.

Rules: sentence case everywhere, one `<h1>` per route, max reading width of
about 75 characters (`max-w-prose`), tabular figures for numeric columns.

### Radius

A single `--radius` token drives the whole scale (`rounded-sm` … `rounded-4xl`).
Do not hardcode pixel radii.

### Motion

Two easing curves (`--ease-out-quint`, `--ease-in-out-quint`) and one entrance
animation (`animate-rise-in`). Motion either answers an action or marks a single
view entrance. It is never a scattered effect, and it collapses under
`prefers-reduced-motion`.

---

## 4. Components

### `components/ui` (shadcn)

Generated via the CLI. Import from `@/components/ui/<name>`. Keep them close to
upstream so `shadcn add` diffs stay clean; the only sanctioned edit is theming
integration (for example, `sonner.tsx` reads our own `useTheme`).

Add one with:

```bash
bunx --bun shadcn@latest add <component>
```

Then fix any imports the registry got wrong and check the rules below.

### `components/app` (product primitives)

| Component      | Use it for                                                     |
| -------------- | -------------------------------------------------------------- |
| `AppShell`     | Page chrome: sidebar, top bar, main region. Wraps every route. |
| `PageHeader`   | The single `<h1>` and page actions.                            |
| `PageSection`  | A titled `<h2>` region.                                        |
| `StatCard`     | A compact metric tile.                                         |
| `StatusBadge`  | Conversation state: status dot plus text label.                |
| `EmptyState`   | Empty results, with a way to act.                              |
| `LoadingState` | Skeletons shaped like the content they replace.                |
| `ErrorState`   | What failed and how to recover.                                |
| `ThemeToggle`  | Light / dark / system.                                         |
| `BrandMark`    | The TIRP mark.                                                 |

Import them from `@/components/app`.

---

## 5. Composition rules

These mirror the shadcn rules and are enforced in review.

- **Semantic tokens only.** No raw colours, no manual `dark:` colour overrides.
- **Layout with `gap-*`.** Never `space-x-*` / `space-y-*`.
- **`size-*` for squares.** `size-8`, not `w-8 h-8`.
- **`truncate`** instead of `overflow-hidden text-ellipsis whitespace-nowrap`.
- **`cn()`** for conditional classes, never string ternaries.
- **Full card composition.** `CardHeader` / `CardTitle` / `CardDescription` /
  `CardContent` / `CardFooter` — do not dump everything into `CardContent`.
- **Overlays need titles.** `Dialog`, `Sheet`, `Drawer`, and `AlertDialog` always
  render a title (use `sr-only` if it is visually redundant).
- **Items live inside their group.** `SelectItem` inside `SelectGroup`,
  `DropdownMenuItem` inside a group, and so on.
- **Use a component, not markup.** `Alert` for callouts, `Empty` for empty
  states, `Badge` for pills, `Separator` for rules, `Skeleton` for loading.
- **Icons.** Pass icon components as values (`icon={CheckIcon}`). In a `Button`,
  set `data-icon="inline-start"` / `"inline-end"`; let the component size it.
  Icon-only buttons need an `aria-label`.
- **No manual `z-index`** on overlays.
- **Toast via `sonner`** (`toast()`), and never as the only signal for
  something important.

---

## 6. States

Every data view defines all four states before it is considered done:

| State   | What it looks like                                             |
| ------- | -------------------------------------------------------------- |
| Loading | `LoadingState` shaped like the final content.                  |
| Empty   | `EmptyState`: what would appear here, plus one primary action. |
| Error   | `ErrorState`: what failed, and a retry.                        |
| Success | The real content.                                              |

Partial data (some fields missing) is a real state too: render a placeholder,
never "undefined".

---

## 7. Accessibility (target: WCAG 2.2 AA)

- Keyboard: every control reachable, in a logical order, with a visible focus
  ring. The shell provides a "Skip to main content" link.
- Landmarks: one `<main>`, a `<nav>` for navigation.
- Headings: one `<h1>` per route; sections use `<h2>`.
- Controls: labels are associated; errors use `aria-invalid` plus visible text.
- Colour: 4.5:1 for body text, 3:1 for large text and UI boundaries. Status is
  never colour-only — a dot is always paired with a label.
- Overlays: focus is trapped and a title is exposed.
- Motion: respects `prefers-reduced-motion`.
- Touch: targets near 44×44px on small screens.
- Zoom: usable at 200% with no horizontal scrolling.

---

## 8. Mobile and responsive

Design at 320px first, then enhance.

| Breakpoint | From   | Behaviour                                      |
| ---------- | ------ | ---------------------------------------------- |
| base       | 320px  | One column, sheet navigation, stacked actions. |
| `sm`       | 640px  | Two-column grids, inline table columns appear. |
| `md`       | 768px  | Sidebar becomes persistent.                    |
| `lg`       | 1024px | Three/four columns, side-by-side panes.        |
| `xl`       | 1280px | Wider measure, more table context.             |

- Use CSS logical properties (`ps-`, `pe-`) where direction matters.
- Tables scroll horizontally rather than squashing; a card list is the mobile
  alternative.
- No hover-only affordances.
- Test at 320, 375, 768, 1024, and large desktop.

---

## 9. Engineering guidelines

- **Alias.** Import app code through `@/*`. Do not add a second alias.
- **Routes.** File-based in `src/routes`. Route components compose; logic lives
  in hooks and `lib`. Add pending/error/not-found handling.
- **Data access.** Typed adapter in `src/lib/api` (`DashboardAdapter`); reads
  run through `getDashboardAdapter()` inside hooks/route containers, never from
  presentational components. Reads may come from the mock adapter's
  deterministic fixtures; mutating actions (send, status, escalation, trigger
  runs) must surface the structured `DashboardApiError` instead of simulating
  success until the Phase 3 endpoints exist. Phase 3 swaps the adapter with
  `setDashboardAdapter()`.
- **Forms.** Use `FieldGroup` + `Field` (never a raw `div` with `space-y-*`).
  Validation uses `data-invalid` on `Field` and `aria-invalid` on the control.
- **Formatting.** Prettier with `prettier-plugin-tailwindcss` (classes are
  sorted for you). Run `bun run format` before committing.
- **Type safety.** `strict` TypeScript with `noUnusedLocals` and
  `noUnusedParameters`. Run `bun run typecheck`.
- **Clean dev console.** No hydration mismatches, no React warnings, no errors
  on `/` or `/design-system`. TanStack Devtools is deliberately omitted — it
  caused false hydration mismatches and a console-logging loop (see `CLAUDE.md`).
- **Privacy.** Conversation data can contain personal information. Mask phone
  numbers by default, never log message bodies to the console, never persist
  conversation content in localStorage or cookies.

### Commands

```bash
bun run dev             # dev server on :3000
bun run build           # production build
bun run typecheck       # tsc --noEmit
bun run format          # write formatting
bun run check           # typecheck + format check
bun run generate-routes # regenerate the route tree after adding routes
```

---

## 10. Recipes

### Add a page

1. Create `src/routes/<name>.tsx` with `createFileRoute("/<name>")`.
2. Add a `PageHeader` (one `<h1>`) and wrap content in `PageSection`s.
3. Register it in `src/lib/navigation.ts` so it appears in the sidebar.
4. Define loading, empty, and error states.

### Add a component

1. Check `components/ui` and `components/app` first.
2. If it is generic, `shadcn add` it.
3. If it is product-specific, compose it in `components/app` from `ui` parts,
   using tokens and `cn()`.
4. Add it to the `/design-system` showcase and to `components/app/index.ts`.

### Add a token

Add the variable in `src/styles.css` for both light and dark, map it in
`@theme inline`, then use the utility. Never reference the raw variable from a
component.

---

## 11. Roadmap

- **Phase 1 (done):** scaffold, tokens, typography, primitives, showcase, docs.
- **Phase 2 (done):** Overview, conversation list + detail with search and
  filters, reply composer, trigger cards + run dialog + execution history.
  Reads run on the mock adapter; mutating actions report structured errors
  naming the missing endpoints.
- **Phase 3:** authenticated conversation APIs in `tirp-server`, swap in the
  HTTP adapter, pagination cursor via the server, live updates.
