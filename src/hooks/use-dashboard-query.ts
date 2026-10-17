import { useCallback, useEffect, useRef, useState } from "react"

export interface DashboardQuery<T> {
  /** `null` until the first successful response. */
  data: T | null
  error: string | null
  /** True on the first fetch for the current key. */
  loading: boolean
  /** True on background refetches (new key) or when retrying. */
  refreshing: boolean
  refetch: () => void
}

type Fetcher<T> = (signal: AbortSignal) => Promise<T>

/**
 * Minimal data-fetching hook for dashboard views (no external query
 * library). Views render `loading` before the first response from the
 * current fetcher, then stay mounted while later key changes refetch in the
 * background. Presentational components must not call fetch functions
 * directly; routes and containers pass a stable fetcher here.
 */
export function useDashboardQuery<T>(
  fetcher: Fetcher<T>,
  deps: readonly unknown[],
): DashboardQuery<T> {
  const [state, setState] = useState<{
    data: T | null
    error: string | null
    loading: boolean
    refreshing: boolean
  }>({ data: null, error: null, loading: true, refreshing: false })

  const [attempt, setAttempt] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const hasData = state.data !== null

  useEffect(() => {
    const controller = new AbortController()
    if (hasData) {
      setState((previous) => ({ ...previous, refreshing: true, error: null }))
    } else {
      setState({ data: null, error: null, loading: true, refreshing: false })
    }
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setState({ data, error: null, loading: false, refreshing: false })
      })
      .catch((thrown: unknown) => {
        if (controller.signal.aborted) return
        const message =
          thrown instanceof Error
            ? thrown.message
            : "The dashboard could not load this view."
        setState((previous) => ({
          data: previous.data,
          error: message,
          loading: false,
          refreshing: false,
        }))
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const refetch = useCallback(() => setAttempt((value) => value + 1), [])

  return { ...state, refetch }
}
