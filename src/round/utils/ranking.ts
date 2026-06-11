// Final standings: ranking the roster by Total and declaring the Winner(s).

import type { Player, Round } from "../roundTypes";
import { totalFor, isRoundComplete } from "./scoring";

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
