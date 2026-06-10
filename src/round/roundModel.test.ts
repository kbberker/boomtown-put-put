import { describe, it, expect } from "vitest";
import {
  createRound,
  loadRound,
  saveRound,
  clearRound,
  setScore,
  isHoleScored,
  isRoundComplete,
  unscoredHoleCount,
  rankPlayers,
  totalFor,
  nextUnscoredHole,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "./roundModel";
import { HOLE_COUNT } from "../holes/holesConfig";

describe("roundModel", () => {
  it("exposes a roster size of 1 to 6 Players", () => {
    expect(MIN_PLAYERS).toBe(1);
    expect(MAX_PLAYERS).toBe(6);
  });

  it("creates a Round whose roster matches the given names", () => {
    const round = createRound(["Alice", "Bob"]);
    expect(round.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
  });

  it("trims Player names and permits duplicates", () => {
    const round = createRound([" Sam ", "Sam"]);
    expect(round.players.map((p) => p.name)).toEqual(["Sam", "Sam"]);
  });

  it("starts every Player with 9 blank Scores (not yet entered)", () => {
    const round = createRound(["Alice"]);
    expect(round.players[0].scores).toHaveLength(HOLE_COUNT);
    expect(round.players[0].scores.every((s) => s === null)).toBe(true);
  });

  it("reports a running Total of 0 for a Player with no Scores entered", () => {
    const round = createRound(["Alice"]);
    expect(totalFor(round.players[0])).toBe(0);
  });

  it("sums only the entered Scores for a running Total", () => {
    const round = createRound(["Alice"]);
    round.players[0].scores[0] = 3;
    round.players[0].scores[4] = 2;
    expect(totalFor(round.players[0])).toBe(5);
  });

  it("sets a Player Score on a Hole without mutating the original Round", () => {
    const round = createRound(["Alice", "Bob"]);
    const updated = setScore(round, 0, 2, 4);
    expect(updated.players[0].scores[2]).toBe(4);
    // The original Round is untouched.
    expect(round.players[0].scores[2]).toBeNull();
    expect(updated).not.toBe(round);
  });

  it("stores the boundary Score of 9 unchanged", () => {
    const round = createRound(["Alice"]);
    expect(setScore(round, 0, 0, 9).players[0].scores[0]).toBe(9);
  });

  it("caps a Score at 9 (picked up)", () => {
    const round = createRound(["Alice"]);
    const updated = setScore(round, 0, 0, 12);
    expect(updated.players[0].scores[0]).toBe(9);
  });

  it("clamps a Score up to the minimum of 1", () => {
    const round = createRound(["Alice"]);
    expect(setScore(round, 0, 0, 0).players[0].scores[0]).toBe(1);
  });

  it("leaves other Players and Holes unchanged when setting a Score", () => {
    const round = createRound(["Alice", "Bob"]);
    const updated = setScore(round, 1, 3, 5);
    expect(updated.players[0].scores[3]).toBeNull();
    expect(updated.players[1].scores[0]).toBeNull();
    expect(updated.players[1].scores[3]).toBe(5);
  });

  it("reports a Hole as not scored until every Player has a Score", () => {
    let round = createRound(["Alice", "Bob"]);
    expect(isHoleScored(round, 0)).toBe(false);
    round = setScore(round, 0, 0, 3);
    expect(isHoleScored(round, 0)).toBe(false);
    round = setScore(round, 1, 0, 2);
    expect(isHoleScored(round, 0)).toBe(true);
  });

  it("persists and reloads the active Round", () => {
    const round = createRound(["Alice", "Bob"]);
    saveRound(round);
    expect(loadRound()).toEqual(round);
  });

  it("returns null when no active Round is stored", () => {
    expect(loadRound()).toBeNull();
  });

  it("returns null when the stored Round is corrupt", () => {
    localStorage.setItem("putt-putt:round", "not json");
    expect(loadRound()).toBeNull();
  });

  it("clears the active Round so a later load finds none", () => {
    saveRound(createRound(["Alice"]));
    clearRound();
    expect(loadRound()).toBeNull();
  });

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

  it("reports a Round complete only when every Player scored every Hole", () => {
    let round = createRound(["Alice", "Bob"]);
    expect(isRoundComplete(round)).toBe(false);
    round = setScore(round, 0, 0, 3);
    expect(isRoundComplete(round)).toBe(false);
    expect(isRoundComplete(fullyScored(["Alice", "Bob"]))).toBe(true);
  });

  it("counts Holes that are not yet fully scored", () => {
    let round = createRound(["Alice", "Bob"]);
    expect(unscoredHoleCount(round)).toBe(HOLE_COUNT);
    // Only Alice scored on Hole 1, so it still counts as unscored.
    round = setScore(round, 0, 0, 3);
    expect(unscoredHoleCount(round)).toBe(HOLE_COUNT);
    round = setScore(round, 1, 0, 2);
    expect(unscoredHoleCount(round)).toBe(HOLE_COUNT - 1);
    expect(unscoredHoleCount(fullyScored(["Alice", "Bob"]))).toBe(0);
  });

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

  describe("nextUnscoredHole", () => {
    it("returns the first unscored Hole when no `after` is given", () => {
      let round = createRound(["Alice", "Bob"]);
      expect(nextUnscoredHole(round)).toBe(0);
      // Fully score Holes 1 and 2 -> first unscored is Hole index 2.
      for (const h of [0, 1]) {
        round = setScore(round, 0, h, 2);
        round = setScore(round, 1, h, 3);
      }
      expect(nextUnscoredHole(round)).toBe(2);
    });

    it("treats a partially scored Hole as unscored", () => {
      let round = createRound(["Alice", "Bob"]);
      round = setScore(round, 0, 0, 2); // Bob still blank on Hole 1
      expect(nextUnscoredHole(round)).toBe(0);
    });

    it("starts scanning after the given Hole", () => {
      const round = createRound(["Alice"]);
      expect(nextUnscoredHole(round, 3)).toBe(4);
    });

    it("wraps past the last Hole back to the start", () => {
      let round = createRound(["Alice"]);
      // Score every Hole except Hole index 1.
      for (let h = 0; h < HOLE_COUNT; h++) {
        if (h !== 1) round = setScore(round, 0, h, 2);
      }
      expect(nextUnscoredHole(round, 5)).toBe(1);
    });

    it("returns null for a complete Round", () => {
      expect(nextUnscoredHole(fullyScored(["Alice", "Bob"]))).toBeNull();
      expect(nextUnscoredHole(fullyScored(["Alice", "Bob"]), 4)).toBeNull();
    });
  });
});
