import { describe, it, expect, vi } from 'vitest'
import {
  HOLE_COUNT,
  DEFAULT_PAR,
  defaultHoles,
  loadHoles,
  saveHoles,
  refreshHoles,
  isHoleArray,
  type Hole,
} from './holesConfig'

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('holesConfig', () => {
  describe('defaultHoles', () => {
    it('produces 9 holes named "Hole 1".."Hole 9" with par 3', () => {
      const holes = defaultHoles()
      expect(holes).toHaveLength(HOLE_COUNT)
      expect(holes[0]).toEqual({ name: 'Hole 1', par: DEFAULT_PAR })
      expect(holes[8]).toEqual({ name: 'Hole 9', par: DEFAULT_PAR })
      expect(holes.every((h) => h.par === 3)).toBe(true)
    })
  })

  describe('loadHoles', () => {
    it('seeds defaults when storage is empty', () => {
      expect(loadHoles()).toEqual(defaultHoles())
    })

    it('persists the seeded defaults on first load', () => {
      loadHoles()
      // Mutating defaults afterwards must not affect what was stored.
      const stored = loadHoles()
      expect(stored).toEqual(defaultHoles())
      expect(stored).toHaveLength(HOLE_COUNT)
    })

    it('returns saved edits instead of defaults when a config exists', () => {
      const edited: Hole[] = defaultHoles()
      edited[2] = { name: 'The Windmill', par: 4 }
      saveHoles(edited)

      const loaded = loadHoles()
      expect(loaded[2]).toEqual({ name: 'The Windmill', par: 4 })
      expect(loaded).toEqual(edited)
    })

    it('falls back to defaults when stored data is corrupt', () => {
      localStorage.setItem('putt-putt:holes', 'not json{')
      expect(loadHoles()).toEqual(defaultHoles())
    })
  })

  describe('refreshHoles', () => {
    it('fetches the shared course from /api/holes', async () => {
      stubFetch(() => Promise.resolve(jsonResponse(defaultHoles())))
      await refreshHoles()
      expect(fetch).toHaveBeenCalledWith('/api/holes')
    })

    it('re-caches and returns the fetched course on success', async () => {
      const shared: Hole[] = defaultHoles()
      shared[2] = { name: 'The Windmill', par: 4 }
      stubFetch(() => Promise.resolve(jsonResponse(shared)))

      const result = await refreshHoles()

      expect(result).toEqual(shared)
      // localStorage is now a cache: a synchronous load sees the fresh course.
      expect(loadHoles()).toEqual(shared)
    })

    it('keeps the cached course when the network is unavailable', async () => {
      const cached: Hole[] = defaultHoles()
      cached[0] = { name: 'Loop the Loop', par: 2 }
      saveHoles(cached)
      stubFetch(() => Promise.reject(new Error('offline')))

      const result = await refreshHoles()

      expect(result).toEqual(cached)
      expect(loadHoles()).toEqual(cached)
    })

    it('falls back to defaults when offline with nothing cached', async () => {
      stubFetch(() => Promise.reject(new Error('offline')))
      expect(await refreshHoles()).toEqual(defaultHoles())
    })

    it('ignores an invalid response body and keeps the cache', async () => {
      const cached: Hole[] = defaultHoles()
      cached[0] = { name: 'Loop the Loop', par: 2 }
      saveHoles(cached)
      stubFetch(() => Promise.resolve(jsonResponse({ not: 'a course' })))

      const result = await refreshHoles()

      expect(result).toEqual(cached)
      expect(loadHoles()).toEqual(cached)
    })

    it('ignores a non-OK response and keeps the cache', async () => {
      stubFetch(() => Promise.resolve(jsonResponse(defaultHoles(), 500)))
      expect(await refreshHoles()).toEqual(defaultHoles())
    })
  })

  describe('isHoleArray', () => {
    it('accepts a well-formed 9-hole array', () => {
      expect(isHoleArray(defaultHoles())).toBe(true)
    })

    it('rejects the wrong length', () => {
      expect(isHoleArray([{ name: 'Hole 1', par: 3 }])).toBe(false)
    })

    it('rejects entries with the wrong field types', () => {
      const holes: unknown[] = defaultHoles()
      holes[0] = { name: 'Hole 1', par: 'three' }
      expect(isHoleArray(holes)).toBe(false)
    })

    it('rejects non-array values', () => {
      expect(isHoleArray(null)).toBe(false)
      expect(isHoleArray({ holes: [] })).toBe(false)
    })
  })

  describe('saveHoles', () => {
    it('round-trips through loadHoles', () => {
      const holes = defaultHoles()
      holes[0] = { name: 'Loop the Loop', par: 2 }
      saveHoles(holes)
      expect(loadHoles()).toEqual(holes)
    })
  })
})
