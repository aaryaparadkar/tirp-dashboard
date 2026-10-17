import { BrandMark, PageSection } from "@/components/app"

import { Specimen, Swatch } from "./specimen"

const TYPE_SCALE = [
  {
    name: "text-4xl",
    cls: "text-4xl font-semibold tracking-tight",
    note: "36px",
  },
  {
    name: "text-3xl",
    cls: "text-3xl font-semibold tracking-tight",
    note: "30px",
  },
  {
    name: "text-2xl",
    cls: "text-2xl font-semibold tracking-tight",
    note: "24px",
  },
  { name: "text-xl", cls: "text-xl font-medium", note: "20px" },
  { name: "text-lg", cls: "text-lg font-medium", note: "18px" },
  { name: "text-base", cls: "text-base", note: "16px" },
  { name: "text-sm", cls: "text-sm", note: "14px" },
  { name: "text-xs", cls: "text-xs", note: "12px" },
]

const SURFACE_TOKENS = [
  { name: "background", cls: "bg-background text-foreground" },
  { name: "card", cls: "bg-card text-card-foreground" },
  { name: "popover", cls: "bg-popover text-popover-foreground" },
  { name: "muted", cls: "bg-muted text-muted-foreground" },
  { name: "accent", cls: "bg-accent text-accent-foreground" },
  { name: "secondary", cls: "bg-secondary text-secondary-foreground" },
]

const SOLID_TOKENS = [
  { name: "primary", cls: "bg-primary text-primary-foreground" },
  { name: "success", cls: "bg-success text-success-foreground" },
  { name: "info", cls: "bg-info text-info-foreground" },
  { name: "warning", cls: "bg-warning text-warning-foreground" },
  { name: "destructive", cls: "bg-destructive text-destructive-foreground" },
]

const SOFT_TOKENS = [
  { name: "primary-soft", cls: "bg-primary-soft text-primary-soft-foreground" },
  { name: "success-soft", cls: "bg-success-soft text-success-soft-foreground" },
  { name: "info-soft", cls: "bg-info-soft text-info-soft-foreground" },
  { name: "warning-soft", cls: "bg-warning-soft text-warning-soft-foreground" },
  {
    name: "destructive-soft",
    cls: "bg-destructive-soft text-destructive-soft-foreground",
  },
]

const CHART_TOKENS = [
  { name: "chart-1", cls: "bg-chart-1" },
  { name: "chart-2", cls: "bg-chart-2" },
  { name: "chart-3", cls: "bg-chart-3" },
  { name: "chart-4", cls: "bg-chart-4" },
  { name: "chart-5", cls: "bg-chart-5" },
]

export function FoundationsSection() {
  return (
    <>
      <PageSection
        id="brand"
        title="Brand and typography"
        description="IBM Plex Sans for interface text and IBM Plex Mono for identifiers,
          timestamps, and numeric data. One display weight carries hierarchy;
          there are no decorative eyebrow labels."
      >
        <div className="flex flex-col gap-8">
          <Specimen label="Mark">
            <div className="flex items-center gap-3">
              <BrandMark className="size-10" />
              <div className="flex flex-col">
                <span className="text-sm leading-tight font-semibold">
                  TIRP
                </span>
                <span className="text-muted-foreground text-xs">
                  Conversations console
                </span>
              </div>
            </div>
          </Specimen>

          <div className="flex flex-col divide-y">
            {TYPE_SCALE.map((step) => (
              <div
                key={step.name}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
              >
                <span className="text-muted-foreground w-24 font-mono text-xs">
                  {step.note}
                </span>
                <span className={step.cls}>
                  The assistant replied in seconds
                </span>
              </div>
            ))}
          </div>

          <Specimen label="Monospace data" className="font-mono text-sm">
            <span>+61400000000</span>
            <span className="text-muted-foreground">2026-10-17 14:32:08</span>
            <span>latency 412ms</span>
          </Specimen>
        </div>
      </PageSection>

      <PageSection
        id="color"
        title="Colour"
        description="Semantic tokens only — components never reference raw colour values.
          Each token adapts between light and dark."
      >
        <div className="flex flex-col gap-8">
          <Specimen
            label="Surfaces"
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {SURFACE_TOKENS.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                className={token.cls}
              />
            ))}
          </Specimen>

          <Specimen
            label="Solid status"
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {SOLID_TOKENS.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                className={token.cls}
              />
            ))}
          </Specimen>

          <Specimen
            label="Soft status surfaces"
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {SOFT_TOKENS.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                className={token.cls}
              />
            ))}
          </Specimen>

          <Specimen
            label="Chart series"
            className="grid w-full grid-cols-3 gap-3 sm:grid-cols-5"
          >
            {CHART_TOKENS.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                className={`${token.cls} text-primary-foreground`}
              />
            ))}
          </Specimen>

          <Specimen label="Lines and focus">
            <div className="flex items-center gap-4">
              <div className="bg-card h-10 w-28 rounded-md border" />
              <div className="bg-input h-10 w-28 rounded-md" />
              <div className="outline-ring flex size-10 items-center justify-center rounded-full outline-2 outline-offset-2">
                <span className="text-muted-foreground text-xs">focus</span>
              </div>
            </div>
          </Specimen>
        </div>
      </PageSection>
    </>
  )
}
