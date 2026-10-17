import { useEffect, useState } from "react"

/**
 * Returns true after the first client render. Used sparingly for things that
 * cannot render on the server (charts, canvases) while keeping SSR output
 * stable, following the pattern already used in the design-system showcase.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
