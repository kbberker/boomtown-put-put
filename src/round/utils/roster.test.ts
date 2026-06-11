import { describe, it, expect } from "vitest";
import {
  createRound,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_NAME_LENGTH,
} from "./roster";
import { HOLE_COUNT } from "../../holes/holesConfig";

describe("roster", () => {
  it("exposes a roster size of 1 to 6 Players", () => {
    expect(MIN_PLAYERS).toBe(1);
    expect(MAX_PLAYERS).toBe(6);
  });

  it("creates a Round whose roster matches the given names", () => {
    const round = createRound(["Alice", "Bob"]);
    expect(round.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
  });

  it("trims Player names and permits duplicates, never truncating", () => {
    const round = createRound([" Sam ", "Sam"]);
    expect(round.players.map((p) => p.name)).toEqual(["Sam", "Sam"]);
    // The model owns the cap as a rule but does not silently truncate names;
    // an over-long name is stored verbatim (New Round blocks tee-off instead).
    const long = "Bartholomewson";
    expect(long.length).toBeGreaterThan(MAX_NAME_LENGTH);
    expect(createRound([long]).players[0].name).toBe(long);
  });

  it("starts every Player with 9 blank Scores (not yet entered)", () => {
    const round = createRound(["Alice"]);
    expect(round.players[0].scores).toHaveLength(HOLE_COUNT);
    expect(round.players[0].scores.every((s) => s === null)).toBe(true);
  });
});
