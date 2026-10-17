import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { RefreshCwIcon } from "lucide-react"

import {
  DemoDataNote,
  ErrorState,
  LoadingState,
  PageHeader,
  PageSection,
  RangeSelect,
} from "@/components/app"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EnquiriesOverTime } from "@/components/overview/enquiries-over-time"
import { IntentMix } from "@/components/overview/intent-mix"
import { KpiCard } from "@/components/overview/kpi-card"
import { RecentConversations } from "@/components/overview/recent-conversations"
import { ShareRows } from "@/components/overview/share-rows"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardQuery } from "@/hooks/use-dashboard-query"
import { getDashboardAdapter } from "@/lib/api/dashboard"
import {
  DEFAULT_FILTERS,
  type ConversationSummary,
  type OverviewSnapshot,
  type Page,
  type RangeId,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({ component: Overview })

function Overview() {
  const [range, setRange] = useState<RangeId>("7d")
  const overview = useDashboardQuery<OverviewSnapshot>(
    () => getDashboardAdapter().getOverview(range),
    [range],
  )
  const recent = useDashboardQuery<Page<ConversationSummary>>(
    () =>
      getDashboardAdapter().listConversations(DEFAULT_FILTERS, {
        page: 1,
        pageSize: 5,
      }),
    [],
  )

  const refreshing = overview.refreshing

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Overview"
        description="What arrived, what people asked, and where the assistant needed a person. Monitoring lives here; every action happens in Conversations or Triggers."
        actions={
          <>
            <RangeSelect
              value={range}
              onValueChange={setRange}
              disabled={overview.loading || refreshing}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={overview.refetch}
              disabled={overview.loading || refreshing}
            >
              <RefreshCwIcon
                aria-hidden="true"
                className={cn(
                  refreshing && "motion-safe:animate-spin",
                  "size-4",
                )}
              />
              Refresh
            </Button>
          </>
        }
      />

      {overview.error ? (
        <ErrorState
          title="The overview snapshot could not be loaded"
          description={overview.error}
          onRetry={overview.refetch}
        />
      ) : null}

      {overview.loading ? <OverviewSkeleton /> : null}

      {overview.data ? (
        <div className="flex flex-col gap-8" aria-busy={refreshing}>
          <DemoDataNote generatedAt={overview.data.generatedAt} />

          <PageSection
            id="kpis"
            title="Enquiries and outcomes"
            description="Key counts for the selected window, each compared with the previous period of the same length. CSAT is not collected yet and stays marked as such."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.data.kpis.map((metric) => (
                <KpiCard key={metric.id} metric={metric} />
              ))}
            </div>
          </PageSection>

          <PageSection
            id="volume"
            title="Volume over time"
            description="Inbound enquiries against every outbound reply, drawn in Australia/Sydney time."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <EnquiriesOverTime
                points={overview.data.timeline}
                loading={refreshing}
                className="lg:col-span-2"
              />
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Peak enquiry times</CardTitle>
                  <CardDescription>Standing weekly pattern.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {overview.data.peakTimes.map((peak) => (
                    <div
                      key={peak.windowLabel}
                      className="flex flex-col gap-0.5"
                    >
                      <p className="font-mono text-sm font-medium">
                        {peak.windowLabel}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {peak.detail}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </PageSection>

          <PageSection
            id="analysis"
            title="Enquiry analysis"
            description="Where traffic concentrates and where conversations currently sit."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <IntentMix intents={overview.data.intents} loading={refreshing} />
              <ShareRows
                title="Conversation status"
                description="Current standing of every conversation in the window."
                rows={overview.data.statuses.map((status) => ({
                  id: status.status,
                  label: status.label,
                  count: status.count,
                  sharePct: status.sharePct,
                }))}
                loading={refreshing}
              />
            </div>
          </PageSection>

          <PageSection
            id="audience"
            title="Audience and quality"
            description="Language coverage, reply direction, and what went wrong."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ShareRows
                title="Language"
                rows={overview.data.languages}
                loading={refreshing}
                maxLength={3}
              />
              <ShareRows
                title="Direction"
                description="Inbound enquiries against outbound replies."
                rows={[
                  {
                    id: "inbound",
                    label: "Inbound",
                    count: overview.data.direction.inbound,
                    sharePct: sharePercent(
                      overview.data.direction.inbound,
                      overview.data.direction,
                    ),
                  },
                  {
                    id: "outbound",
                    label: "Outbound",
                    count: overview.data.direction.outbound,
                    sharePct: sharePercent(
                      overview.data.direction.outbound,
                      overview.data.direction,
                    ),
                  },
                ]}
                loading={refreshing}
              />
              <ShareRows
                title="Error reasons"
                description="Failures recorded by the assistant's own run log."
                rows={overview.data.errors}
                loading={refreshing}
                maxLength={5}
              />
            </div>
          </PageSection>

          <PageSection
            id="recent"
            title="Recent activity"
            description="The most recent conversations — each row opens the chat in Conversations."
          >
            {recent.error ? (
              <ErrorState
                title="Recent conversations could not be loaded"
                description={recent.error}
                onRetry={recent.refetch}
              />
            ) : recent.loading ? (
              <LoadingState rows={3} />
            ) : (
              <RecentConversations
                rows={recent.data?.data ?? []}
                loading={recent.refreshing}
                generatedAt={overview.data.generatedAt}
              />
            )}
          </PageSection>
        </div>
      ) : null}
    </div>
  )
}

function sharePercent(
  value: number,
  direction: { inbound: number; outbound: number },
): number {
  const total = direction.inbound + direction.outbound
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <Skeleton className="h-14 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}
