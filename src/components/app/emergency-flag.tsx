import { PhoneCallIcon, SirenIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, relativeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConversationSummary } from "@/lib/api/types"

/**
 * Emergency flag: the assistant showed this contact the "Call 000" button.
 * Never colour alone — always an icon plus the words "000 shown".
 */
export function EmergencyBadge({
  conversation,
  className,
}: {
  conversation: Pick<ConversationSummary, "emergencyAt" | "emergencyCount">
  className?: string
}) {
  if (!conversation.emergencyAt) return null
  const times = conversation.emergencyCount ?? 1
  return (
    <Badge
      className={cn(
        "bg-destructive text-destructive-foreground gap-1 border-transparent font-medium",
        className,
      )}
    >
      <SirenIcon aria-hidden="true" className="size-3" />
      000 shown{times > 1 ? ` ×${times}` : ""}
      <span className="sr-only">
        : the assistant showed this contact the emergency call button
      </span>
    </Badge>
  )
}

/** Banner for the conversation detail: what happened, when, and what to do. */
export function EmergencyAlert({
  conversation,
  generatedAt,
}: {
  conversation: Pick<ConversationSummary, "emergencyAt" | "emergencyCount">
  generatedAt: string
}) {
  if (!conversation.emergencyAt) return null
  const times = conversation.emergencyCount ?? 1
  return (
    <Alert
      variant="destructive"
      className="border-destructive bg-destructive-soft text-destructive-soft-foreground *:data-[slot=alert-description]:text-destructive-soft-foreground border-l-4"
    >
      <PhoneCallIcon aria-hidden="true" />
      <AlertTitle>Emergency — student was shown the Call 000 button</AlertTitle>
      <AlertDescription>
        <p>
          {times > 1 ? `Shown ${times} times; last ` : "Shown "}
          <time dateTime={conversation.emergencyAt}>
            {formatDateTime(conversation.emergencyAt)}
          </time>{" "}
          ({relativeAgo(conversation.emergencyAt, generatedAt)}). Escalated
          automatically — the assistant still replies if the student writes
          again. Follow up with the student, then resolve the conversation.
        </p>
      </AlertDescription>
    </Alert>
  )
}
