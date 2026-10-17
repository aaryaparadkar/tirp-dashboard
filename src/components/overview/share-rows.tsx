import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCompact, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Quiet count+share rows used for languages, direction, and error reasons.
 * Numbers over ink: no chart licence needed to read a ranked list.
 */
export function ShareRows({
  title,
  description,
  rows,
  loading,
  maxLength,
  renderTrailing,
  className,
}: {
  title: string
  description?: string
  rows: { id: string; label: string; count: number; sharePct: number }[]
  loading: boolean
  /** Drop rows whose share falls below this percent (e.g. 3). */
  maxLength?: number
  renderTrailing?: (row: { id: string; count: number }) => React.ReactNode
  className?: string
}) {
  const hiddenCount = maxLength
    ? rows.slice(maxLength).reduce((sum, row) => sum + row.count, 0)
    : 0
  const shown = maxLength ? rows.slice(0, maxLength) : rows

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : shown.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing recorded in this window.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {shown.map((row) => (
              <li key={row.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">{row.label}</span>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {formatPercent(row.sharePct)}
                    <span className="sr-only"> of </span>
                    {formatCompact(sumOf(rows))}
                    <span className="sr-only"> total entries:</span>
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                >
                  <div
                    className="bg-primary/60 h-full rounded-full"
                    style={{ width: `${Math.max(row.sharePct, 2)}%` }}
                  />
                </div>
                <div className={cn(renderTrailing ? "hidden" : "sr-only")}>
                  {formatCompact(row.count)} entries
                </div>
                {renderTrailing ? renderTrailing(row) : null}
              </li>
            ))}
            {hiddenCount > 0 && maxLength !== undefined ? (
              <li className={cn("text-muted-foreground text-xs")}>
                + {formatCompact(hiddenCount)} in {rows.length - maxLength}{" "}
                smaller buckets
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function sumOf(rows: { count: number }[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0)
}
