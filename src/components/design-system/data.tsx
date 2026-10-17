import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  PageSection,
  StatCard,
  StatusBadge,
  type StatusTone,
} from "@/components/app"

import { Specimen } from "./specimen"

const CONVERSATIONS: {
  name: string
  initials: string
  preview: string
  intent: string
  status: string
  tone: StatusTone
  updated: string
}[] = [
  {
    name: "Aisha Khan",
    initials: "AK",
    preview: "Thanks, that clears it up.",
    intent: "OSHC cover",
    status: "Resolved",
    tone: "success",
    updated: "2m",
  },
  {
    name: "Marco Silva",
    initials: "MS",
    preview: "What documents do I need?",
    intent: "Claims",
    status: "In progress",
    tone: "info",
    updated: "14m",
  },
  {
    name: "Priya Nair",
    initials: "PN",
    preview: "The link didn't open.",
    intent: "Flows",
    status: "Failed",
    tone: "danger",
    updated: "31m",
  },
  {
    name: "Daniel Okafor",
    initials: "DO",
    preview: "Can I extend the start date?",
    intent: "Quotes",
    status: "Needs review",
    tone: "warning",
    updated: "1h",
  },
]

const chartConfig = {
  inbound: { label: "Inbound", color: "var(--chart-1)" },
  outbound: { label: "Outbound", color: "var(--chart-2)" },
} satisfies ChartConfig

const CHART_DATA = [
  { day: "Mon", inbound: 42, outbound: 38 },
  { day: "Tue", inbound: 55, outbound: 51 },
  { day: "Wed", inbound: 48, outbound: 47 },
  { day: "Thu", inbound: 61, outbound: 58 },
  { day: "Fri", inbound: 72, outbound: 66 },
  { day: "Sat", inbound: 30, outbound: 28 },
  { day: "Sun", inbound: 24, outbound: 22 },
]

export function DataSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <PageSection
        id="cards"
        title="Cards and metrics"
        description="Cards group related content with a single border and no drop
          shadows. Metrics use monospace tabular figures so columns align."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active today" value="128" hint="+12% vs yesterday" />
          <StatCard label="Awaiting reply" value="7" hint="Oldest 14 minutes" />
          <StatCard
            label="Failed sends"
            value="3"
            hint="Retry from the detail view"
          />
          <StatCard
            label="Median latency"
            value="412ms"
            hint="p50, last 24 hours"
          />
        </div>
      </PageSection>

      <PageSection
        id="table"
        title="Table"
        description="Dense tabular data. On narrow screens the table scrolls rather
          than squashing columns; a card list is the mobile alternative."
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Last message
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Intent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONVERSATIONS.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback>{row.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[22rem] truncate sm:table-cell">
                      {row.preview}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.intent}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right font-mono text-xs">
                      {row.updated}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection
        id="charts"
        title="Charts"
        description="Series colours come from the chart tokens, so they stay
          consistent and adapt to dark mode."
      >
        <Card>
          <CardHeader>
            <CardTitle>Messages per day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              {mounted ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart accessibilityLayer data={CHART_DATA}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="inbound"
                      fill="var(--color-inbound)"
                      radius={4}
                    />
                    <Bar
                      dataKey="outbound"
                      fill="var(--color-outbound)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection
        id="navigation"
        title="Navigation"
        description="Tabs switch views within a page; breadcrumbs show position;
          pagination moves through long lists."
      >
        <div className="flex flex-col gap-8">
          <Specimen label="Breadcrumb" className="block w-full">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Overview</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Conversations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Aisha Khan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Specimen>

          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
            <TabsContent
              value="timeline"
              className="text-muted-foreground pt-4 text-sm"
            >
              The message timeline renders here.
            </TabsContent>
            <TabsContent
              value="details"
              className="text-muted-foreground pt-4 text-sm"
            >
              Contact and session metadata render here.
            </TabsContent>
            <TabsContent
              value="sources"
              className="text-muted-foreground pt-4 text-sm"
            >
              Knowledge-base sources used by the reply render here.
            </TabsContent>
          </Tabs>

          <Specimen label="Pagination" className="block w-full">
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Specimen>
        </div>
      </PageSection>
    </>
  )
}
