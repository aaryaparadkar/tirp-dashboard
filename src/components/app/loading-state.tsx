import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Loading placeholders shaped like the content they replace, so the layout
 * does not jump when data arrives.
 */
export function LoadingState({
  variant = "list",
  rows = 5,
  className,
}: {
  variant?: "list" | "cards" | "text"
  rows?: number
  className?: string
}) {
  const items = Array.from({ length: rows }, (_, index) => index)

  if (variant === "cards") {
    return (
      <div
        className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}
        aria-hidden="true"
      >
        {items.map((index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {items.map((index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  )
}
