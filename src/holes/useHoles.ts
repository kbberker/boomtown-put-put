import { useState, useEffect } from 'react'
import { loadHoles, refreshHoles, type Hole } from './holesConfig'

/**
 * Cache-first read of the shared course (ADR-0003): returns the cached course
 * (or built-in defaults) synchronously for an instant first paint, then kicks
 * off a background {@link refreshHoles} and re-renders with the shared course
 * once it resolves. Offline or function-down silently keeps the cached value.
 */
export function useHoles(): Hole[] {
  const [holes, setHoles] = useState<Hole[]>(loadHoles)

  useEffect(() => {
    let active = true
    refreshHoles().then((fresh) => {
      if (active) setHoles(fresh)
    })
    return () => {
      active = false
    }
  }, [])

  return holes
}
