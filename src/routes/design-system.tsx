import { createFileRoute } from "@tanstack/react-router"

import { PageHeader } from "@/components/app"
import { AccessibilitySection } from "@/components/design-system/accessibility"
import { ControlsSection } from "@/components/design-system/controls"
import { DataSection } from "@/components/design-system/data"
import { FeedbackSection } from "@/components/design-system/feedback"
import { FoundationsSection } from "@/components/design-system/foundations"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/design-system")({
  component: DesignSystem,
})

const SECTIONS = [
  { id: "brand", label: "Brand" },
  { id: "color", label: "Colour" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "forms", label: "Forms" },
  { id: "cards", label: "Cards" },
  { id: "table", label: "Table" },
  { id: "charts", label: "Charts" },
  { id: "navigation", label: "Navigation" },
  { id: "feedback", label: "Feedback" },
  { id: "states", label: "States" },
  { id: "overlays", label: "Overlays" },
  { id: "motion", label: "Motion" },
  { id: "accessibility", label: "Accessibility" },
  { id: "responsive", label: "Responsive" },
]

function DesignSystem() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <PageHeader
        title="Design system"
        description="The shared language for the dashboard: tokens, components, and
          the rules that keep them consistent, accessible, and mobile-friendly.
          Use this page to see a pattern before you build it."
      />

      <nav
        aria-label="Design system sections"
        className="bg-background/85 sticky top-14 z-20 -mx-4 border-b px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
      >
        <ul className="scrollbar-slim flex gap-1 overflow-x-auto">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn(
                  "text-muted-foreground inline-block rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap",
                  "hover:bg-muted hover:text-foreground transition-colors",
                  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <FoundationsSection />
      <ControlsSection />
      <DataSection />
      <FeedbackSection />
      <AccessibilitySection />
    </div>
  )
}
