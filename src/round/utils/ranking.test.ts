import { describe, it, expect } from "vitest";
import { rankPlayers } from "./ranking";
import { setScore } from "./scoring";
import { createRound } from "./roster";
import { HOLE_COUNT } from "../../holes/holesConfig";

// Score every Player on every Hole so the Round counts as complete.
function fullyScored(names: string[]): ReturnType<typeof createRound> {
  let round = createRound(names);
  round.players.forEach((_, p) => {
    for (let h = 0; h < HOLE_COUNT; h++) {
      round = setScore(round, p, h, 2);
    }
  });
  return round;
}

describe("ranking", () => {
  it("ranks Players by ascending Total", () => {
    let round = createRound(["Alice", "Bob"]);
    round = setScore(round, 0, 0, 5); // Alice total 5
    round = setScore(round, 1, 0, 2); // Bob total 2
    const ranked = rankPlayers(round);
    expect(ranked.map((r) => r.player.name)).toEqual(["Bob", "Alice"]);
    expect(ranked.map((r) => r.total)).toEqual([2, 5]);
  });

  it("declares the lowest Total the Winner in a complete Round", () => {
    let round = fullyScored(["Alice", "Bob"]);
    round = setScore(round, 1, 0, 1); // Bob one stroke better
    const ranked = rankPlayers(round);
    expect(ranked[0].player.name).toBe("Bob");
    expect(ranked[0].isWinner).toBe(true);
    expect(ranked[1].isWinner).toBe(false);
  });

  it("declares co-Winners on a tie with no tiebreaker", () => {
    const round = fullyScored(["Alice", "Bob"]); // identical Scores -> tie
    const winners = rankPlayers(round).filter((r) => r.isWinner);
    expect(winners.map((r) => r.player.name).sort()).toEqual(["Alice", "Bob"]);
  });

  it("declares no Winner while the Round is incomplete", () => {
    let round = createRound(["Alice", "Bob"]);
    round = setScore(round, 0, 0, 1); // lowest, but Round not complete
    expect(rankPlayers(round).every((r) => !r.isWinner)).toBe(true);
  });
});
