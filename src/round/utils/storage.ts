// Persistence for the single active Round: localStorage only, no backend or
// history (ADR-0001). load returns null if absent or corrupt.

import type { Round } from "../roundTypes";

const STORAGE_KEY = "putt-putt:round";

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
