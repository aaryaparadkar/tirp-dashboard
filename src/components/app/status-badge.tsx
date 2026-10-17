import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Status is never conveyed by colour alone: the coloured dot is always paired
 * with a text label. The dot uses a solid semantic token, the label uses the
 * default foreground for maximum contrast.
 */
export type StatusTone =
  "neutral" | "primary" | "success" | "warning" | "danger" | "info"

const DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
}

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
}: {
  tone?: StatusTone
  dot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])}
        />
      ) : null}
      {children}
    </Badge>
  )
}
