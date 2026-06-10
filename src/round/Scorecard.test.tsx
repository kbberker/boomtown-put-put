import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { Scorecard } from "./Scorecard";
import { createRound, saveRound, setScore } from "./roundModel";
import { saveHoles, defaultHoles, HOLE_COUNT } from "../holes/holesConfig";

const user = userEvent.setup();

function renderScorecard() {
  render(
    <MemoryRouter initialEntries={["/scorecard"]}>
      <Routes>
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/results" element={<div>RESULTS</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The tappable card-row for one Hole (its accessible name names the Hole). */
function holeRow(name: RegExp) {
  return screen.getByRole("link", { name });
}

// Score every Player on every Hole so the Round counts as complete.
function fullyScoredRound(names: string[]) {
  let round = createRound(names);
  round.players.forEach((_, p) => {
    for (let h = 0; h < HOLE_COUNT; h++) round = setScore(round, p, h, 2);
  });
  return round;
}

describe("Scorecard", () => {
  it("renders a tappable row per Hole linking to its Hole Entry Page", () => {
    const holes = defaultHoles();
    holes[0] = { name: "The Windmill", par: 4 };
    saveHoles(holes);
    saveRound(createRound(["Alice"]));

    renderScorecard();

    const row = holeRow(/the windmill, par 4/i);
    expect(row).toHaveAttribute("href", "/hole/0");
    // All 9 Holes get a row.
    expect(screen.getAllByRole("link", { name: /edit scores/i })).toHaveLength(
      HOLE_COUNT,
    );
  });

  it("shows a column per Player using their name", () => {
    saveHoles(defaultHoles());
    saveRound(createRound(["Alice", "Bob"]));

    renderScorecard();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows every score cell blank (not yet entered)", () => {
    saveHoles(defaultHoles());
    saveRound(createRound(["Alice", "Bob"]));

    renderScorecard();

    const blanks = screen.getAllByLabelText(/not yet entered/i);
    expect(blanks).toHaveLength(2 * HOLE_COUNT);
  });

  it("shows a running Total of 0 for every Player", () => {
    saveHoles(defaultHoles());
    saveRound(createRound(["Alice", "Bob"]));

    renderScorecard();

    expect(screen.getByLabelText("Alice total: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Bob total: 0")).toBeInTheDocument();
  });

  it("reflects entered Scores and recomputed Totals", () => {
    saveHoles(defaultHoles());
    let round = createRound(["Alice"]);
    round = setScore(round, 0, 0, 3);
    round = setScore(round, 0, 1, 2);
    saveRound(round);

    renderScorecard();

    const row = holeRow(/hole 1\b.*scored/i);
    expect(within(row).getByText("3")).toBeInTheDocument();
    expect(screen.getByLabelText("Alice total: 5")).toBeInTheDocument();
  });

  it("announces each Hole as scored once every Player has a Score, else not yet", () => {
    saveHoles(defaultHoles());
    // Alice scored on Hole 1 only; Hole 2 is still blank.
    saveRound(setScore(createRound(["Alice"]), 0, 0, 3));

    renderScorecard();

    expect(holeRow(/hole 1, par \d+, scored/i)).toBeInTheDocument();
    expect(holeRow(/hole 2, par \d+, not yet scored/i)).toBeInTheDocument();
  });

  it("flags the next unscored Hole as up next", () => {
    saveHoles(defaultHoles());
    // Hole 1 fully scored -> Hole 2 is up next.
    saveRound(setScore(createRound(["Alice"]), 0, 0, 3));

    renderScorecard();

    expect(
      within(holeRow(/^hole 2,/i)).getByText(/up next/i),
    ).toBeInTheDocument();
    expect(within(holeRow(/^hole 3,/i)).queryByText(/up next/i)).toBeNull();
  });

  it("offers a bottom CTA jumping to the next unscored Hole", () => {
    saveHoles(defaultHoles());
    saveRound(setScore(createRound(["Alice"]), 0, 0, 3));

    renderScorecard();

    expect(screen.getByRole("link", { name: /score hole 2/i })).toHaveAttribute(
      "href",
      "/hole/1",
    );
  });

  it("shows a message when there is no active Round", () => {
    saveHoles(defaultHoles());
    renderScorecard();
    expect(screen.getByText(/no active round/i)).toBeInTheDocument();
  });

  describe("Finish Round", () => {
    it("always offers a Finish action in the header", () => {
      saveHoles(defaultHoles());
      saveRound(createRound(["Alice"]));
      renderScorecard();
      expect(
        screen.getByRole("button", { name: /finish/i }),
      ).toBeInTheDocument();
    });

    it("soft-warns about blank Holes but proceeds to Results when confirmed", async () => {
      saveHoles(defaultHoles());
      // Only Hole 1 scored, so 8 Holes are still blank.
      saveRound(setScore(createRound(["Alice"]), 0, 0, 3));
      renderScorecard();

      await user.click(screen.getByRole("button", { name: /finish/i }));

      // The styled confirm replaces window.confirm.
      const dialog = screen.getByRole("dialog", { name: /finish early/i });
      expect(dialog).toHaveTextContent(/8 holes are still blank/i);
      expect(screen.queryByText("RESULTS")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /finish anyway/i }));
      expect(screen.getByText("RESULTS")).toBeInTheDocument();
    });

    it("stays on the Scorecard when the blank-Holes warning is dismissed", async () => {
      saveHoles(defaultHoles());
      saveRound(createRound(["Alice"]));
      renderScorecard();

      await user.click(screen.getByRole("button", { name: /finish/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByText("RESULTS")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("finishes a complete Round straight to Results without warning", async () => {
      saveHoles(defaultHoles());
      saveRound(fullyScoredRound(["Alice", "Bob"]));
      renderScorecard();

      await user.click(screen.getByRole("button", { name: /^finish$/i }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("RESULTS")).toBeInTheDocument();
    });

    it("replaces the next-Hole CTA with Finish Round once all Holes are scored", async () => {
      saveHoles(defaultHoles());
      saveRound(fullyScoredRound(["Alice"]));
      renderScorecard();

      expect(screen.queryByRole("link", { name: /score hole/i })).toBeNull();
      await user.click(screen.getByRole("button", { name: /finish round/i }));
      expect(screen.getByText("RESULTS")).toBeInTheDocument();
    });
  });
});
