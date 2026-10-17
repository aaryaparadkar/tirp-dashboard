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
import { useMounted } from "@/hooks/use-mounted"
import type { IntentSlice } from "@/lib/api/types"
import { formatNumber } from "@/lib/format"

/** Top intents rendered as horizontal bars; the rest is a quiet footer. */
export function IntentMix({
  intents,
  loading,
  className,
}: {
  intents: IntentSlice[]
  loading: boolean
  className?: string
}) {
  const mounted = useMounted()
  const top = intents.slice(0, 8)
  const rest = intents.slice(8)
  const restCount = rest.reduce((sum, slice) => sum + slice.count, 0)

  const chartConfig = {
    count: { label: "Enquiries", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const total = intents.reduce((sum, slice) => sum + slice.count, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Popular enquiry types</CardTitle>
        <CardDescription>
          Where inbound volume concentrates, by the assistant's intent
          classification.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading || !mounted ? (
          <Skeleton className="h-64 w-full" aria-hidden="true" />
        ) : (
          <div className="h-64 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={top}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={3}
                  barSize={14}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {rest.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            + {formatNumber(restCount)} more across {rest.length} other intents
            {total > 0 ? ` (${formatNumber(total)} enquiries classified)` : ""}.
          </p>
        ) : null}
        <p className="sr-only">
          Top enquiry types:{" "}
          {top
            .map((slice) => `${slice.label} ${formatNumber(slice.count)}`)
            .join(", ")}
          .
        </p>
      </CardContent>
    </Card>
  )
}
