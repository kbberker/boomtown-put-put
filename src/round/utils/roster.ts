// Roster rules and Round creation: how many Players a Round may hold, the
// Player-name length cap, and how a fresh Round is assembled from names.

import { HOLE_COUNT } from "../../holes/holesConfig";
import type { Round } from "../roundTypes";

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

// A Player name may be at most 12 characters. This is the single source of the
// rule; New Round warns and blocks tee-off when a name exceeds it (names are
// never silently truncated — see the validation in NewRound).
export const MAX_NAME_LENGTH = 12;

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
