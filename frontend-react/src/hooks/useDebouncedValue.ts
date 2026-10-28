import { useEffect, useState } from 'react'

/**
 * Returns `value` only after it has stopped changing for `delay` ms. Used by the search box so
 * the API is called once when the user stops typing, not on every key.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer) // a new keystroke cancels the pending update
  }, [value, delay])
  return debounced
}
