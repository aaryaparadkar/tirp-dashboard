/**
 * Dashboard client bootstrap.
 *
 * Chooses the adapter (fixtures vs `tirp-server`) and owns the operator
 * session state that the auth gate renders. No conversation content is held
 * here — only the operator identity and CSRF token returned by the backend.
 */

import {
  DashboardApiError,
  getDashboardAdapter,
  isMockAdapter,
  mockAdapter,
  setDashboardAdapter,
} from "./dashboard"
import { createHttpAdapter } from "./http-adapter"
import { loadSession, setUnauthorizedHandler, signIn, signOut } from "./http"
import type { SessionInfo } from "./types"

export type AdapterMode = "mock" | "http"

/**
 * `VITE_DASHBOARD_ADAPTER=http` connects to `tirp-server`. Anything else keeps
 * the deterministic fixture adapter, so the console never silently talks to a
 * backend that is not configured.
 */
export function adapterMode(): AdapterMode {
  return import.meta.env.VITE_DASHBOARD_ADAPTER === "http" ? "http" : "mock"
}

let adapterReady = false

/** Install the selected adapter. Idempotent; safe to call on every render. */
export function initialiseDashboardAdapter(): AdapterMode {
  const mode = adapterMode()
  if (!adapterReady) {
    setDashboardAdapter(mode === "http" ? createHttpAdapter() : mockAdapter)
    adapterReady = true
  }
  return mode
}

/* ------------------------------------------------------------- session state */

export type SessionStatus = "mock" | "loading" | "authenticated" | "anonymous"

export interface SessionState {
  status: SessionStatus
  session: SessionInfo | null
}

function initialState(): SessionState {
  return {
    status: adapterMode() === "mock" ? "mock" : "loading",
    session: null,
  }
}

let state: SessionState = initialState()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function setState(next: SessionState): void {
  state = next
  emit()
}

export function getSessionState(): SessionState {
  return state
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let handlerInstalled = false

function installUnauthorizedHandler(): void {
  if (handlerInstalled) return
  handlerInstalled = true
  setUnauthorizedHandler(() => {
    if (state.status !== "anonymous") {
      setState({ status: "anonymous", session: null })
    }
  })
}

/** Load the current session. On fixtures this is a no-op. */
export async function refreshSession(): Promise<void> {
  const mode = initialiseDashboardAdapter()
  if (mode === "mock") {
    setState({ status: "mock", session: null })
    return
  }
  installUnauthorizedHandler()
  setState({ status: "loading", session: null })
  try {
    const session = await loadSession()
    setState({ status: "authenticated", session })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    setState({ status: "anonymous", session: null })
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const session = await signIn(email, password)
  setState({ status: "authenticated", session })
}

export async function logoutOperator(): Promise<void> {
  await signOut()
  setState({ status: "anonymous", session: null })
}

export { DashboardApiError, getDashboardAdapter, isMockAdapter }
