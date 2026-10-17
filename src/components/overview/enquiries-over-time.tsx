import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { TimelinePoint } from "@/lib/api/types"
import { formatCompact } from "@/lib/format"

const chartConfig = {
  inbound: { label: "Inbound", color: "var(--chart-1)" },
  outbound: { label: "Outbound", color: "var(--chart-2)" },
} satisfies ChartConfig

/**
 * Enquiry volume over the selected window. Recharts renders client-side
 * only (the mounted guard keeps SSR output identical to hydration), and the
 * card carries an sr-only text summary so the data is not chart-only.
 */
export function EnquiriesOverTime({
  points,
  loading,
  className,
}: {
  points: TimelinePoint[]
  loading: boolean
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const totalInbound = points.reduce((sum, point) => sum + point.inbound, 0)
  const totalOutbound = points.reduce((sum, point) => sum + point.outbound, 0)
  const peak = points.reduce<TimelinePoint | null>(
    (best, point) => (!best || point.inbound > best.inbound ? point : best),
    null,
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Enquiry volume</CardTitle>
        <CardDescription>
          Inbound enquiries against outbound assistant and operator replies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !mounted ? (
          <Skeleton className="h-56 w-full" aria-hidden="true" />
        ) : (
          <div className="h-56 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart accessibilityLayer data={points}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="inbound" fill="var(--color-inbound)" radius={3} />
                <Bar
                  dataKey="outbound"
                  fill="var(--color-outbound)"
                  radius={3}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        <p className="sr-only">
          Over the selected window there were {formatCompact(totalInbound)}{" "}
          inbound enquiries and {formatCompact(totalOutbound)} outbound replies.
          {peak
            ? ` The busiest bucket is ${peak.label} with ${formatCompact(peak.inbound)} inbound.`
            : ""}
        </p>
      </CardContent>
    </Card>
  )
}
