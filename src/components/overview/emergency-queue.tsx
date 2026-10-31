import { Link } from "@tanstack/react-router"
import { ArrowRightIcon, SirenIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ConversationSummary } from "@/lib/api/types"
import { relativeAgo } from "@/lib/format"

/**
 * Overview banner: every unresolved conversation where the student was shown
 * the Call 000 button. Renders nothing when there are none.
 */
export function EmergencyQueue({
  items,
  generatedAt,
}: {
  items: ConversationSummary[]
  generatedAt: string
}) {
  if (items.length === 0) return null
  return (
    <Alert
      variant="destructive"
      className="border-destructive bg-destructive-soft text-destructive-soft-foreground *:data-[slot=alert-description]:text-destructive-soft-foreground border-l-4"
    >
      <SirenIcon aria-hidden="true" />
      <AlertTitle>
        {items.length === 1
          ? "1 emergency needs follow-up"
          : `${items.length} emergencies need follow-up`}
      </AlertTitle>
      <AlertDescription className="[&_a]:no-underline">
        <p>
          The assistant showed these students the Call 000 button. Check on
          them, then resolve the conversation.
        </p>
        <ul className="mt-2 flex w-full flex-col divide-y border-y border-current/15">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                to="/conversations"
                search={{ c: item.id }}
                className="hover:bg-destructive/10 focus-visible:ring-ring flex items-center justify-between gap-3 px-1 py-1.5 no-underline outline-none focus-visible:ring-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">
                    {item.contact.displayName}
                  </span>
                  <span className="font-mono text-xs opacity-80">
                    {item.contact.maskedPhone}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums">
                  000 shown{" "}
                  {item.emergencyAt
                    ? relativeAgo(item.emergencyAt, generatedAt)
                    : ""}
                  <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
