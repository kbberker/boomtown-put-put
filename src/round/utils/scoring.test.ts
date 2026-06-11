import { describe, it, expect } from "vitest";
import {
  setScore,
  isHoleScored,
  totalFor,
  isRoundComplete,
  unscoredHoleCount,
  nextUnscoredHole,
} from "./scoring";
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

describe("scoring", () => {
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
