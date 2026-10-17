import { useEffect, useSyncExternalStore } from "react"

import {
  getSessionState,
  refreshSession,
  subscribeSession,
  type SessionState,
} from "@/lib/api/client"

/**
 * Subscribe to the operator session. On fixtures the status is `mock` and the
 * console is always available; against `tirp-server` the session is loaded once
 * on mount and kept in sync with 401 responses.
 */
export function useSession(): SessionState {
  const state = useSyncExternalStore(
    subscribeSession,
    getSessionState,
    getSessionState,
  )

  useEffect(() => {
    if (state.status === "loading") {
      void refreshSession()
    }
  }, [state.status])

  return state
}
