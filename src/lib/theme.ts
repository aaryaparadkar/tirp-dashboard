/**
 * Theme model.
 *
 * Three user-facing modes — light, dark, and system — resolved to two concrete
 * themes. The resolved theme is expressed as a `light` / `dark` class on
 * <html>, which the `dark:` variant in src/styles.css keys off.
 */

export type ThemeMode = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "tirp-theme"

const MODES: readonly ThemeMode[] = ["light", "dark", "system"]

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === "string" && (MODES as readonly string[]).includes(value)
  )
}

export function resolveTheme(
  mode: ThemeMode,
  prefersDark: boolean,
): ResolvedTheme {
  if (mode === "system") return prefersDark ? "dark" : "light"
  return mode
}

/** Read the persisted mode. Safe to call during SSR (returns "system"). */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system"
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : "system"
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}

/** Apply a mode to the document. Idempotent and SSR-safe. */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const resolved = resolveTheme(mode, prefersDark)
  const root = document.documentElement

  root.classList.toggle("dark", resolved === "dark")
  root.classList.toggle("light", resolved === "light")
  root.style.colorScheme = resolved

  if (mode === "system") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", mode)
  }
}

/**
 * Blocking script inlined into <head> so the correct theme is applied before
 * first paint. Kept dependency-free and defensive on purpose.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="tirp-theme";var s=localStorage.getItem(k);var m=(s==="light"||s==="dark"||s==="system")?s:"system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=m==="system"?(d?"dark":"light"):m;var e=document.documentElement;e.classList.add(r);if(m==="system"){e.removeAttribute("data-theme")}else{e.setAttribute("data-theme",m)}e.style.colorScheme=r}catch(t){}})();`
