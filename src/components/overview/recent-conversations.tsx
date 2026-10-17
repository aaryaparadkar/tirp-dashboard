import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/app"
import {
  HANDLING_LABEL,
  INTENT_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ConversationSummary,
} from "@/lib/api/types"
import { formatClock, maskPhone, relativeAgo } from "@/lib/format"

/**
 * Most recent conversations, one row per chat, each leading to the
 * conversation workspace with the chat preselected. Handles the loading,
 * empty, and error states through props so the route composes them.
 */
export function RecentConversations({
  rows,
  loading,
  generatedAt,
  className,
}: {
  rows: ConversationSummary[]
  loading: boolean
  generatedAt: string
  className?: string
}) {
  if (rows.length === 0 && !loading) return null

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Latest conversations</CardTitle>
          <CardDescription>
            Every row opens in Conversations with the chat already selected.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/conversations">
            Open the workspace
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">
            Loading latest conversations…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No conversations matched the current window yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Intent</TableHead>
                <TableHead className="hidden lg:table-cell">Handling</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      to="/conversations"
                      search={{ c: row.id }}
                      className="focus-visible:ring-ring -mx-1 flex items-center gap-2.5 rounded-sm px-1 py-1 outline-none focus-visible:ring-2"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback>{row.contact.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {row.contact.displayName}
                      </span>
                      {row.unreadCount > 0 ? (
                        <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none">
                          {row.unreadCount} new
                        </span>
                      ) : null}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">
                    {maskPhone(row.contact.phone)}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {INTENT_LABEL[row.intent]}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                    {HANDLING_LABEL[row.handlingMode]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={STATUS_TONE[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right font-mono text-xs whitespace-nowrap tabular-nums">
                    {relativeAgo(row.lastActivityAt, generatedAt)}
                    <span className="hidden sm:inline">
                      {" "}
                      · {formatClock(row.lastActivityAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
