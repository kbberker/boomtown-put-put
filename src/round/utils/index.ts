// Barrel for the Round logic modules so callers have one entry point
// (import from "./utils"). Domain shapes live in ../roundTypes and are imported
// from there directly — they are intentionally not re-exported here.

export {
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_NAME_LENGTH,
  createRound,
} from "./roster";
export {
  MIN_SCORE,
  MAX_SCORE,
  setScore,
  isHoleScored,
  totalFor,
  isRoundComplete,
  unscoredHoleCount,
  nextUnscoredHole,
} from "./scoring";
export type { RankedPlayer } from "./ranking";
export { rankPlayers } from "./ranking";
export { saveRound, clearRound, loadRound } from "./storage";
