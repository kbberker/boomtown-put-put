// The active Round: a roster of Players, locked at creation, plus their Scores.
// Only one Round is active at a time and it persists in localStorage so an
// in-progress Round survives a refresh (see ADR-0001).

import { HOLE_COUNT } from "../holes/holesConfig";

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

// A Score is "not yet entered" (null) until the Scorekeeper records strokes for
// that Player on that Hole. scores has one entry per Hole.
export type Player = {
  name: string;
  scores: (number | null)[];
};

export type Round = {
  players: Player[];
};

const STORAGE_KEY = "putt-putt:round";

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
  };
}

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

// A Player's final standing: their Total and whether they are a Winner. Only a
// complete Round can declare a Winner; ties on the lowest Total yield co-Winners.
export type RankedPlayer = {
  player: Player;
  total: number;
  isWinner: boolean;
};

/**
 * Rank the roster by ascending Total (lowest first; original order breaks ties).
 * The lowest-Total Player(s) are flagged as Winner, but only in a complete Round
 * — an incomplete Round that was finished early has no Winner.
 */
export function rankPlayers(round: Round): RankedPlayer[] {
  const ranked = round.players
    .map((player) => ({ player, total: totalFor(player), isWinner: false }))
    .sort((a, b) => a.total - b.total);
  const complete = isRoundComplete(round);
  const lowest = ranked.length > 0 ? ranked[0].total : 0;
  return ranked.map((r) => ({
    ...r,
    isWinner: complete && r.total === lowest,
  }));
}

/** Persist the active Round, replacing any previous one. */
export function saveRound(round: Round): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(round));
}

/** Clear the active Round (e.g. after finishing), leaving none stored. */
export function clearRound(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Load the active Round, or null if none is stored or the data is corrupt. */
export function loadRound(): Round | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    return isRound(value) ? value : null;
  } catch {
    return null;
  }
}

function isRound(value: unknown): value is Round {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Round).players) &&
    (value as Round).players.every(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        typeof p.name === "string" &&
        Array.isArray(p.scores),
    )
  );
}
