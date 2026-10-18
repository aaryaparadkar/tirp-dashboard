/**
 * HTTP plumbing for the dashboard API.
 *
 * Every request sends the operator session cookie (`credentials: "include"`)
 * and, on mutations, the CSRF token minted at login. Failures normalize to
 * `DashboardApiError` with the shared error shape from
 * `src/lib/api/README.md`; network failures surface as `network` errors.
 */

import { DashboardApiError, ERROR_TITLES } from "./dashboard"
import type { ApiErrorCode, SessionInfo } from "./types"

const ERROR_CODES: readonly ApiErrorCode[] = [
  "unauthorized",
  "forbidden",
  "rate_limited",
  "not_found",
  "validation",
  "conflict",
  "unavailable",
  "unsupported",
  "network",
]

/** API origin. Empty string means same-origin (proxied to tirp-server). */
export function apiBase(): string {
  const raw =
    (import.meta.env.VITE_DASHBOARD_API_BASE as string | undefined) ?? ""
  return raw.trim().replace(/\/$/, "")
}

let csrfToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setCsrfToken(token: string | null): void {
  csrfToken = token
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

interface ServerErrorBody {
  error?: { code?: unknown; message?: unknown; status?: unknown }
}

function normalizeCode(raw: unknown, status: number): ApiErrorCode {
  if (
    typeof raw === "string" &&
    (ERROR_CODES as readonly string[]).includes(raw)
  ) {
    return raw as ApiErrorCode
  }
  switch (status) {
    case 401:
      return "unauthorized"
    case 403:
      return "forbidden"
    case 404:
      return "not_found"
    case 409:
      return "conflict"
    case 422:
      return "validation"
    case 429:
      return "rate_limited"
    case 501:
      return "unsupported"
    case 502:
    case 503:
    case 504:
      return "unavailable"
    default:
      return status >= 500 ? "unavailable" : "validation"
  }
}

export function toApiError(
  status: number,
  payload: unknown,
): DashboardApiError {
  const body = (payload ?? {}) as ServerErrorBody
  const code = normalizeCode(body.error?.code, status)
  const message =
    typeof body.error?.message === "string" && body.error.message.trim()
      ? body.error.message
      : `The dashboard request failed (${status}).`
  return new DashboardApiError({
    code,
    title: ERROR_TITLES[code],
    message,
    status,
  })
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  signal?: AbortSignal
}

export interface RawResponse<T> {
  ok: boolean
  status: number
  payload: T | null
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

/**
 * Perform a request without throwing on HTTP error status. Callers that need
 * the error body (for example a failed reply that still carries the stored
 * message) read `payload` directly; `apiRequest` wraps this for the common case.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<RawResponse<T>> {
  const method = options.method ?? "GET"
  const headers: Record<string, string> = { accept: "application/json" }
  if (options.body !== undefined) headers["content-type"] = "application/json"
  if (csrfToken && method !== "GET") headers["x-csrf-token"] = csrfToken

  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      credentials: "include",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (isAbort(error)) throw error
    throw new DashboardApiError({
      code: "network",
      title: ERROR_TITLES.network,
      message:
        "The dashboard could not reach tirp-server. Check the connection and try again.",
    })
  }

  const text = await response.text()
  let payload: T | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as T
    } catch {
      payload = null
    }
  }

  if (response.status === 401 && path !== "/dashboard/auth/login") {
    unauthorizedHandler?.()
  }

  return { ok: response.ok, status: response.status, payload }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const result = await apiFetch<T>(path, options)
  if (!result.ok) throw toApiError(result.status, result.payload)
  return result.payload as T
}

/* ------------------------------------------------------------------- auth */

export async function signIn(
  email: string,
  password: string,
): Promise<SessionInfo> {
  const session = await apiRequest<SessionInfo>("/dashboard/auth/login", {
    method: "POST",
    body: { email, password },
  })
  setCsrfToken(session.csrfToken)
  return session
}

export async function signOut(): Promise<void> {
  try {
    await apiRequest("/dashboard/auth/logout", { method: "POST" })
  } catch {
    // A failed logout still clears the local session below.
  }
  setCsrfToken(null)
}

export async function loadSession(): Promise<SessionInfo> {
  const session = await apiRequest<SessionInfo>("/dashboard/auth/session")
  setCsrfToken(session.csrfToken)
  return session
}
