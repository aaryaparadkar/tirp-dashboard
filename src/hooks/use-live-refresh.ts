import { useEffect, useRef } from "react"

/**
 * Call `tick` every `intervalMs` while the tab is visible, and once right
 * away when the operator comes back to the tab. Pauses in the background so
 * a forgotten tab does not poll the server all day.
 */
export function useLiveRefresh(
  tick: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return
    let timer: number | undefined

    const start = () => {
      if (timer !== undefined) return
      timer = window.setInterval(() => tickRef.current(), intervalMs)
    }
    const stop = () => {
      if (timer === undefined) return
      window.clearInterval(timer)
      timer = undefined
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tickRef.current()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [intervalMs, enabled])
}
