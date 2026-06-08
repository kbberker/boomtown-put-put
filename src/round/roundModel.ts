// The active Round: a roster of Players, locked at creation, plus their Scores.
// Only one Round is active at a time and it persists in localStorage so an
// in-progress Round survives a refresh (see ADR-0001).

import { HOLE_COUNT } from '../holes/holesConfig'

export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 6

// A Score is "not yet entered" (null) until the Scorekeeper records strokes for
// that Player on that Hole. scores has one entry per Hole.
export type Player = {
  name: string
  scores: (number | null)[]
}

export type Round = {
  players: Player[]
}

const STORAGE_KEY = 'putt-putt:round'

/**
 * Create a Round from the given Player names. The roster is fixed here and does
 * not change for the life of the Round. Names are trimmed; duplicates are kept.
 */
export function createRound(names: string[]): Round {
  return {
    players: names.map((name) => ({
      name: name.trim(),
      scores: Array.from({ length: HOLE_COUNT }, () => null),
    })),
  }
}

// A Score is a positive integer from 1 to 9 — 9 means the Player picked up.
// This model is the single place that enforces the invariant, so the 1–9 input
// can later be swapped (e.g. for a stepper) without re-litigating the bounds.
export const MIN_SCORE = 1
export const MAX_SCORE = 9

/**
 * Set a Player's Score on one Hole, returning a new Round (the input is left
 * untouched). The value is coerced to an integer and clamped to 1–9, since a
 * Score is a positive integer and failing to sink it by 9 means taking a 9.
 * Indexing mirrors round.players[playerIndex].scores[holeIndex].
 */
export function setScore(
  round: Round,
  playerIndex: number,
  holeIndex: number,
  value: number,
): Round {
  const capped = Math.min(Math.max(Math.round(value), MIN_SCORE), MAX_SCORE)
  return {
    players: round.players.map((player, p) =>
      p === playerIndex
        ? {
            ...player,
            scores: player.scores.map((score, h) =>
              h === holeIndex ? capped : score,
            ),
          }
        : player,
    ),
  }
}

/** A Hole is "scored" once every Player has a Score entered on it. */
export function isHoleScored(round: Round, holeIndex: number): boolean {
  return round.players.every((player) => player.scores[holeIndex] !== null)
}

/** A Player's running Total: the sum of their entered (non-blank) Scores. */
export function totalFor(player: Player): number {
  return player.scores.reduce<number>((sum, score) => sum + (score ?? 0), 0)
}

/** Persist the active Round, replacing any previous one. */
export function saveRound(round: Round): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(round))
}

/** Load the active Round, or null if none is stored or the data is corrupt. */
export function loadRound(): Round | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  try {
    const value = JSON.parse(raw)
    return isRound(value) ? value : null
  } catch {
    return null
  }
}

function isRound(value: unknown): value is Round {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Round).players) &&
    (value as Round).players.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.name === 'string' &&
        Array.isArray(p.scores),
    )
  )
}
