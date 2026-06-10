import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHoles } from './useHoles'
import { defaultHoles, saveHoles, type Hole } from './holesConfig'

describe('useHoles', () => {
  it('returns the cached course synchronously', () => {
    const cached: Hole[] = defaultHoles()
    cached[0] = { name: 'Loop the Loop', par: 2 }
    saveHoles(cached)

    const { result } = renderHook(() => useHoles())

    // Available on first render — no waiting on the network.
    expect(result.current).toEqual(cached)
  })

  it('swaps in the shared course once the refresh resolves', async () => {
    const shared: Hole[] = defaultHoles()
    shared[0] = { name: 'The Windmill', par: 4 }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(shared)))),
    )

    const { result } = renderHook(() => useHoles())

    // Starts on the built-in defaults, then refreshes to the fetched course.
    expect(result.current[0].name).toBe('Hole 1')
    await waitFor(() => expect(result.current).toEqual(shared))
  })
})
