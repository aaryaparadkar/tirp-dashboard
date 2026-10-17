import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { KpiMetric } from "@/lib/api/types"
import { formatCompact, formatDuration, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Overview KPI tile. Renders an explicit "Not available" state when the
 * backend cannot produce the metric (e.g. CSAT), and a signed trend chip
 * whose tone follows the metric's own `betterWhen` rule — a rising latency
 * is rendered as a decline, never as a positive.
 */
export function KpiCard({
  metric,
  className,
}: {
  metric: KpiMetric
  className?: string
}) {
  const value =
    metric.value === null
      ? "Not available"
      : metric.unit === "ms"
        ? formatDuration(metric.value)
        : metric.unit === "pct"
          ? formatPercent(metric.value)
          : formatCompact(metric.value)

  const trend = trendFor(metric)

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle
          className={cn(
            "font-mono text-2xl font-medium tracking-tight tabular-nums",
            metric.value === null &&
              "text-muted-foreground text-xl font-normal",
          )}
        >
          {value}
        </CardTitle>
        {trend ? (
          <CardAction>
            <Badge
              variant="outline"
              className={cn("gap-1 font-normal", trend.className)}
            >
              {trend.decreasing ? (
                <TrendingDownIcon aria-hidden="true" className="size-3" />
              ) : (
                <TrendingUpIcon aria-hidden="true" className="size-3" />
              )}
              {trend.label}
              <span className="sr-only">{trend.srText}</span>
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {metric.hint}
      </CardContent>
    </Card>
  )
}

function trendFor(metric: KpiMetric) {
  const change = metric.changePct
  if (change === null || change === undefined || metric.value === null) {
    return {
      className: "text-muted-foreground",
      decreasing: false,
      label: metric.betterWhen === "down" ? "steady" : "steady",
      srText: "No period comparison for this metric",
    }
  }
  const rounded =
    change >= 0 ? `+${formatPercent(change)}` : formatPercent(change)
  const improving = metric.betterWhen === "down" ? change < 0 : change > 0
  const tone = change === 0 ? "flat" : improving ? "good" : "bad"
  return {
    decreasing: change < 0,
    label: `${rounded}${change === 0 ? " (flat)" : ""}`,
    className:
      tone === "good"
        ? "text-success"
        : tone === "bad"
          ? "text-destructive"
          : "text-muted-foreground",
    srText: `${change < 0 ? "Down" : change === 0 ? "Unchanged" : "Up"} ${formatPercent(Math.abs(change))} compared to the previous period. ${improving ? "That is an improvement." : change === 0 ? "" : "That is a decline."}`,
  }
}
