import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Compact metric tile. The value uses tabular monospace figures so columns of
 * stats line up.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl font-medium tracking-tight tabular-nums">
          {value}
        </CardTitle>
        {Icon ? (
          <CardAction>
            <Icon aria-hidden="true" className="text-muted-foreground size-4" />
          </CardAction>
        ) : null}
      </CardHeader>
      {hint ? (
        <CardContent className="text-muted-foreground text-xs">
          {hint}
        </CardContent>
      ) : null}
    </Card>
  )
}
