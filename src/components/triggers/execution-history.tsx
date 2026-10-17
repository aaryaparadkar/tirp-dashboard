import { Link } from "@tanstack/react-router"
import { HistoryIcon } from "lucide-react"

import { EmptyState, StatusBadge, type StatusTone } from "@/components/app"
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
import type { TriggerExecution } from "@/lib/api/types"
import { formatDateTime, formatDuration } from "@/lib/format"

const STATUS_TONE: Record<TriggerExecution["status"], StatusTone> = {
  running: "info",
  success: "success",
  failed: "danger",
  rejected: "warning",
}

const STATUS_PRESENT: Record<TriggerExecution["status"], string> = {
  running: "Running",
  success: "Succeeded",
  failed: "Failed",
  rejected: "Refused",
}

/**
 * Server-recorded trigger runs. Targets are masked at the data layer;
 * when an execution traceable to a conversation exists, its row links to
 * that conversation in Conversations.
 */
export function TriggerExecutionHistory({
  executions,
  className,
}: {
  executions: TriggerExecution[]
  className?: string
}) {
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HistoryIcon aria-hidden="true" className="size-4" />
          Execution history
        </CardTitle>
        <CardDescription>
          Server logs of real runs — successes, failures, and runs the backend
          refused before anything was sent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <EmptyState
            title="No executions recorded"
            description="When a trigger runs — or is refused — the backend writes an entry here with the outcome and a masked target."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Trigger execution history">
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Conversation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">
                      {execution.triggerName}
                      <span className="text-muted-foreground block font-mono text-[11px]">
                        {execution.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={STATUS_TONE[execution.status]}>
                        {STATUS_PRESENT[execution.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {execution.target}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(execution.startedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {execution.durationMs !== undefined
                        ? formatDuration(execution.durationMs)
                        : "—"}
                      <span className="text-muted-foreground">
                        {execution.sync === "local" ? " · local" : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal">
                      <div className="max-w-72 break-words">
                        {execution.error ? (
                          <span className="text-destructive">
                            {execution.error.code}: {execution.error.message}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {execution.result?.detail ??
                              execution.result?.reference ??
                              "—"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {execution.conversationId ? (
                        <Link
                          to="/conversations"
                          search={{ c: execution.conversationId }}
                          className={
                            "ring-ring underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                          }
                        >
                          Open chat
                        </Link>
                      ) : (
                        <span aria-hidden="true">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
