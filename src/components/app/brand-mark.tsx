import { cn } from "@/lib/utils"

/**
 * TIRP brand mark: a signal dot with two radiating arcs — conversation
 * spreading out from a single source. Decorative, so it is hidden from
 * assistive tech; always pair it with a real text label.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle cx="11" cy="21" r="2.4" className="fill-primary-foreground" />
      <path
        d="M11 15.7A5.3 5.3 0 0 1 16.3 21"
        className="stroke-primary-foreground"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M11 10.4A10.6 10.6 0 0 1 21.6 21"
        className="stroke-primary-foreground"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  )
}
