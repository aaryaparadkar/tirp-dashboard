import { useCallback, useEffect, useState } from "react"

import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme"

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Theme state for the UI. The DOM class is already set by the inline init
 * script before hydration; this hook keeps React state in sync with it and
 * re-applies when the user changes the mode or the OS preference changes.
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>("system")
  const [resolved, setResolved] = useState<ResolvedTheme>("light")

  useEffect(() => {
    const stored = getStoredTheme()
    setModeState(stored)
    setResolved(resolveTheme(stored, prefersDark()))
    applyTheme(stored)
  }, [])

  useEffect(() => {
    if (mode !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      applyTheme("system")
      setResolved(resolveTheme("system", media.matches))
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    setStoredTheme(next)
    applyTheme(next)
    setResolved(resolveTheme(next, prefersDark()))
  }, [])

  return { mode, resolved, setMode }
}
