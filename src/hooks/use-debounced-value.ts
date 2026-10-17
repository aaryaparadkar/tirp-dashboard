import { useEffect, useState } from "react"

/**
 * Delays reacting to a fast-changing value (search inputs) until the user
 * pauses typing. Keeps the intermediate renders out of data fetchers.
 */
export function useDebouncedValue<T>(value: T, delayMs = 220): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
