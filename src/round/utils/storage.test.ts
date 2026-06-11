import { describe, it, expect } from "vitest";
import { saveRound, clearRound, loadRound } from "./storage";
import { createRound } from "./roster";

describe("storage", () => {
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
});
