// Scoring rules and Hole-progress helpers: the 1–9 Score invariant, setting a
// Score, and the pure queries over a Round's scoring state.

import { HOLE_COUNT } from "../../holes/holesConfig";
import type { Player, Round } from "../roundTypes";

// A Score is a positive integer from 1 to 9 — 9 means the Player picked up.
// This model is the single place that enforces the invariant, so the 1–9 input
// can later be swapped (e.g. for a stepper) without re-litigating the bounds.
export const MIN_SCORE = 1;
export const MAX_SCORE = 9;

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
  const capped = Math.min(Math.max(Math.round(value), MIN_SCORE), MAX_SCORE);
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
  };
}

/** A Hole is "scored" once every Player has a Score entered on it. */
export function isHoleScored(round: Round, holeIndex: number): boolean {
  return round.players.every((player) => player.scores[holeIndex] !== null);
}

/** A Player's running Total: the sum of their entered (non-blank) Scores. */
export function totalFor(player: Player): number {
  return player.scores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
}

/** A Round is complete once every Player has a Score on every Hole. */
export function isRoundComplete(round: Round): boolean {
  return round.players.every((player) =>
    player.scores.every((s) => s !== null),
  );
}

/** How many Holes are not yet fully scored (used to soft-warn before finishing). */
export function unscoredHoleCount(round: Round): number {
  let count = 0;
  for (let holeIndex = 0; holeIndex < HOLE_COUNT; holeIndex++) {
    if (!isHoleScored(round, holeIndex)) count++;
  }
  return count;
}

/**
 * The first Hole not fully scored at/after `after` + 1, scanning all Holes and
 * wrapping past the last one, or null once the Round is complete. With no
 * `after` the scan starts at Hole 0. Returns a 0-based Hole index.
 */
export function nextUnscoredHole(round: Round, after?: number): number | null {
  const start = after === undefined ? 0 : after + 1;
  for (let offset = 0; offset < HOLE_COUNT; offset++) {
    const holeIndex = (start + offset) % HOLE_COUNT;
    if (!isHoleScored(round, holeIndex)) return holeIndex;
  }
  return null;
}
