import { describe, it, expect } from 'vitest'
import {
  HOLE_COUNT,
  DEFAULT_PAR,
  defaultHoles,
  loadHoles,
  saveHoles,
  type Hole,
} from './holesConfig'

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

  describe('saveHoles', () => {
    it('round-trips through loadHoles', () => {
      const holes = defaultHoles()
      holes[0] = { name: 'Loop the Loop', par: 2 }
      saveHoles(holes)
      expect(loadHoles()).toEqual(holes)
    })
  })
})
