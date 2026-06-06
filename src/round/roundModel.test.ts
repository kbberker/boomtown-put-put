import { describe, it, expect } from 'vitest'
import {
  createRound,
  loadRound,
  saveRound,
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
