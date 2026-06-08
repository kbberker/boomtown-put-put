import { describe, it, expect } from 'vitest'
import {
  createRound,
  loadRound,
  saveRound,
  setScore,
  isHoleScored,
  totalFor,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from './roundModel'
import { HOLE_COUNT } from '../holes/holesConfig'

describe('roundModel', () => {
  it('exposes a roster size of 1 to 6 Players', () => {
    expect(MIN_PLAYERS).toBe(1)
    expect(MAX_PLAYERS).toBe(6)
  })

  it('creates a Round whose roster matches the given names', () => {
    const round = createRound(['Alice', 'Bob'])
    expect(round.players.map((p) => p.name)).toEqual(['Alice', 'Bob'])
  })

  it('trims Player names and permits duplicates', () => {
    const round = createRound([' Sam ', 'Sam'])
    expect(round.players.map((p) => p.name)).toEqual(['Sam', 'Sam'])
  })

  it('starts every Player with 9 blank Scores (not yet entered)', () => {
    const round = createRound(['Alice'])
    expect(round.players[0].scores).toHaveLength(HOLE_COUNT)
    expect(round.players[0].scores.every((s) => s === null)).toBe(true)
  })

  it('reports a running Total of 0 for a Player with no Scores entered', () => {
    const round = createRound(['Alice'])
    expect(totalFor(round.players[0])).toBe(0)
  })

  it('sums only the entered Scores for a running Total', () => {
    const round = createRound(['Alice'])
    round.players[0].scores[0] = 3
    round.players[0].scores[4] = 2
    expect(totalFor(round.players[0])).toBe(5)
  })

  it('sets a Player Score on a Hole without mutating the original Round', () => {
    const round = createRound(['Alice', 'Bob'])
    const updated = setScore(round, 0, 2, 4)
    expect(updated.players[0].scores[2]).toBe(4)
    // The original Round is untouched.
    expect(round.players[0].scores[2]).toBeNull()
    expect(updated).not.toBe(round)
  })

  it('stores the boundary Score of 9 unchanged', () => {
    const round = createRound(['Alice'])
    expect(setScore(round, 0, 0, 9).players[0].scores[0]).toBe(9)
  })

  it('caps a Score at 9 (picked up)', () => {
    const round = createRound(['Alice'])
    const updated = setScore(round, 0, 0, 12)
    expect(updated.players[0].scores[0]).toBe(9)
  })

  it('clamps a Score up to the minimum of 1', () => {
    const round = createRound(['Alice'])
    expect(setScore(round, 0, 0, 0).players[0].scores[0]).toBe(1)
  })

  it('leaves other Players and Holes unchanged when setting a Score', () => {
    const round = createRound(['Alice', 'Bob'])
    const updated = setScore(round, 1, 3, 5)
    expect(updated.players[0].scores[3]).toBeNull()
    expect(updated.players[1].scores[0]).toBeNull()
    expect(updated.players[1].scores[3]).toBe(5)
  })

  it('reports a Hole as not scored until every Player has a Score', () => {
    let round = createRound(['Alice', 'Bob'])
    expect(isHoleScored(round, 0)).toBe(false)
    round = setScore(round, 0, 0, 3)
    expect(isHoleScored(round, 0)).toBe(false)
    round = setScore(round, 1, 0, 2)
    expect(isHoleScored(round, 0)).toBe(true)
  })

  it('persists and reloads the active Round', () => {
    const round = createRound(['Alice', 'Bob'])
    saveRound(round)
    expect(loadRound()).toEqual(round)
  })

  it('returns null when no active Round is stored', () => {
    expect(loadRound()).toBeNull()
  })

  it('returns null when the stored Round is corrupt', () => {
    localStorage.setItem('putt-putt:round', 'not json')
    expect(loadRound()).toBeNull()
  })
})
