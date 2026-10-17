import { PageSection } from "@/components/app"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const A11Y_RULES: { area: string; rule: string }[] = [
  {
    area: "Keyboard",
    rule: "Every interactive element is reachable by Tab, with a visible focus ring and a logical order.",
  },
  {
    area: "Landmarks",
    rule: "One <main> per page, a <nav> for navigation, and a skip link that appears on focus.",
  },
  {
    area: "Headings",
    rule: "One <h1> per route. Sections use <h2> so the outline stays predictable.",
  },
  {
    area: "Controls",
    rule: "Icon-only buttons carry an aria-label. Form fields have a label and inline error text.",
  },
  {
    area: "Colour",
    rule: "Text meets 4.5:1 and large text and UI boundaries meet 3:1. Status never relies on colour alone.",
  },
  {
    area: "Overlays",
    rule: "Dialogs, sheets, and drawers trap focus and expose a title and description.",
  },
  {
    area: "Motion",
    rule: "Prefers-reduced-motion collapses animation and transitions to near zero.",
  },
  {
    area: "Touch",
    rule: "Interactive targets stay near 44×44px on small screens.",
  },
]

const BREAKPOINTS = [
  {
    name: "Base",
    min: "320px",
    note: "Single column, sheet navigation, stacked actions.",
  },
  {
    name: "sm",
    min: "640px",
    note: "Two-column grids, inline table columns appear.",
  },
  {
    name: "md",
    min: "768px",
    note: "Sidebar becomes persistent; drawers become sheets.",
  },
  {
    name: "lg",
    min: "1024px",
    note: "Three and four column layouts, detail panes side by side.",
  },
  {
    name: "xl",
    min: "1280px",
    note: "Wider reading measure, more table context.",
  },
]

export function AccessibilitySection() {
  return (
    <>
      <PageSection
        id="accessibility"
        title="Accessibility"
        description="The target is WCAG 2.2 AA. These rules apply to every component
          and page, not just the examples here."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {A11Y_RULES.map((item) => (
            <div
              key={item.area}
              className="bg-card flex flex-col gap-1 rounded-lg border p-3.5"
            >
              <span className="text-sm font-medium">{item.area}</span>
              <span className="text-muted-foreground text-sm">{item.rule}</span>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        id="responsive"
        title="Mobile and responsive"
        description="Designed at 320px first. Desktop enhancements are added only
          once the small screen works."
      >
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Breakpoint</TableHead>
                <TableHead className="w-24">From</TableHead>
                <TableHead>Behaviour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BREAKPOINTS.map((bp) => (
                <TableRow key={bp.name}>
                  <TableCell className="font-mono text-xs">{bp.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {bp.min}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bp.note}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>
    </>
  )
}
