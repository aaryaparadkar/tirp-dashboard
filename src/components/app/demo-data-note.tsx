import { DatabaseZapIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isMockAdapter } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format"

/**
 * Honest disclosure that the console is reading the deterministic fixture
 * adapter rather than `tirp-server`. Rendered only in mock mode; once the HTTP
 * adapter is active the note disappears so the console never claims demo data
 * when it is talking to the real backend.
 */
export function DemoDataNote({ generatedAt }: { generatedAt: string | null }) {
  if (!isMockAdapter()) return null

  return (
    <Alert>
      <DatabaseZapIcon aria-hidden="true" />
      <AlertTitle>Demo data — not connected to tirp-server</AlertTitle>
      <AlertDescription>
        Every view reads deterministic fixtures so the console can be reviewed
        offline. Nothing here can send a message or change a live conversation;
        actions report the exact endpoint they are waiting for. Set
        <span className="font-mono text-xs"> VITE_DASHBOARD_ADAPTER=http </span>
        to connect the real API.
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
