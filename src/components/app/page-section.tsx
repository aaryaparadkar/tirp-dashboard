import { cn } from "@/lib/utils"

/**
 * A titled region of a page. Uses an <h2> to keep the heading hierarchy
 * predictable: one <h1> per route (PageHeader), then PageSections beneath it.
 */
export function PageSection({
  id,
  title,
  description,
  actions,
  className,
  children,
}: {
  id?: string
  title?: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={id && title ? `${id}-title` : undefined}
      className={cn("flex scroll-mt-20 flex-col gap-4", className)}
    >
      {title ? (
        <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2
              id={id ? `${id}-title` : undefined}
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-muted-foreground max-w-prose text-sm text-pretty">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
