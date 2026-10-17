/**
 * Deterministic formatting helpers.
 *
 * Every label produced here must be identical between the server render and
 * the first client render, so all formatters use a fixed locale and an
 * explicit `timeZone`. Relative labels are derived from the dataset's own
 * `generatedAt` instant — never from `Date.now()`.
 */

import { INTENT_LABEL, type Intent } from "./api/types"

/** Everything is shown to operators in AEDT/AEST, stated explicitly. */
const DISPLAY_TIME_ZONE = "Australia/Sydney"
const DISPLAY_LOCALE = "en-AU"

/* -------------------------------------------------------------- numbers */

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(DISPLAY_LOCALE).format(value)
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(DISPLAY_LOCALE).format(Math.round(value))}%`
}

/** `870000` ms → "15 min"; ≥ 1 h → "1 h 5 min"; ms under a minute → "1.8 s". */
export function formatDuration(ms: number): string {
  if (Math.abs(ms) < 60_000) {
    const seconds = Math.round((ms / 1000) * 10) / 10
    return `${seconds} s`
  }
  const totalMinutes = Math.round(ms / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** `412` → "412"; `1200` → "1.2k"; `1_048_000` → "1.0M". */
export function formatCompact(value: number): string {
  if (Math.abs(value) < 1000) return String(value)
  if (Math.abs(value) < 1_000_000) {
    const thousands = value / 1000
    return `${thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10}k`
  }
  return `${Math.round((value / 1_000_000) * 10) / 10}M`
}

/* ----------------------------------------------------------------- time */

/** `2026-10-17T15:02:00Z` → "17 Oct, 15:02". Deterministic across SSR/CSR. */
export function formatDateTime(iso: string): string {
  const day = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
  return `${day}, ${formatClock(iso)}`
}

/** `…T15:02:00Z` → "15:02" in the display timezone. */
export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
}

/** Date-only label, e.g. "17 Oct 2026". */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso))
}

/**
 * Deterministic relative label between an instant and the dataset snapshot:
 * seconds → "now", then minutes, hours, days, weeks, then the short date.
 */
export function relativeLabel(fromIso: string, toIso: string): string {
  const deltaSeconds = Math.round(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000,
  )
  if (deltaSeconds < 60) return "now"
  const minutes = Math.round(deltaSeconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}w`
  return formatDay(fromIso)
}

/** Human sentence version for headings: "2h ago". */
export function relativeAgo(fromIso: string, toIso: string): string {
  const label = relativeLabel(fromIso, toIso)
  return label === "now" ? "just now" : `${label} ago`
}

/* ---------------------------------------------------------------- phone */

/**
 * Masked for display: keeps the country prefix and the last three digits.
 * "+61412345620" → "+61 ••• ••• 620". The raw value is never rendered.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 5) return "••••"
  const head = digits.slice(0, 2)
  const tail = digits.slice(-3)
  return `+${head} ••• ••• ${tail}`
}

/* -------------------------------------------------------------- people */

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (parts.length === 0) return "?"
  return parts.map((part) => [...part][0]?.toUpperCase() ?? "").join("")
}

/* ------------------------------------------------------------- intents */

/** Intent key → human label; falls back to a title-cased key. */
export function intentLabel(intent: Intent | string): string {
  const known = INTENT_LABEL[intent as Intent]
  return known ?? titleCase(intent)
}

export function titleCase(key: string): string {
  return key
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ")
}

/* ------------------------------------------------------------- strings */

export function truncate(text: string, max = 90): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

/**
 * Cheap E.164 check used by phone inputs (same shape `tirp-server` accepts).
 * Graceful: optional leading "+" plus 8–15 digits.
 */
export function looksLikeE164(value: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(value.trim().replace(/[\s\-().]/g, ""))
}
