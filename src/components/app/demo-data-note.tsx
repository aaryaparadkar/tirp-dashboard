import { DatabaseZapIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/format"

/**
 * Honest disclosure that every data view in the console currently reads the
 * deterministic fixture adapter (`src/lib/api/dashboard.ts`). Reads show
 * real-shaped demo data; every state-changing action reports the Phase 3
 * "unsupported" error instead of faking success.
 */
export function DemoDataNote({ generatedAt }: { generatedAt: string | null }) {
  return (
    <Alert>
      <DatabaseZapIcon aria-hidden="true" />
      <AlertTitle>Demo data — not connected to tirp-server yet</AlertTitle>
      <AlertDescription>
        Every view reads deterministic fixtures so the console can be reviewed
        before the API lands. Nothing can send a message or change a live
        conversation; actions report the exact endpoint they are waiting for.
        {generatedAt ? (
          <span className="font-mono text-xs">
            {" "}
            Snapshot: {formatDateTime(generatedAt)} AEDT.
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
