import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { Results } from "./Results";
import { createRound, saveRound, setScore, loadRound } from "./utils";
import { HOLE_COUNT } from "../holes/holesConfig";

const user = userEvent.setup();

function renderResults() {
  render(
    <MemoryRouter initialEntries={["/results"]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/scorecard" element={<div>SCORECARD</div>} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Score every Player on every Hole so the Round counts as complete.
function fullyScoredRound(names: string[]) {
  let round = createRound(names);
  round.players.forEach((_, p) => {
    for (let h = 0; h < HOLE_COUNT; h++) round = setScore(round, p, h, 2);
  });
  return round;
}

describe("Results", () => {
  it("ranks Players by ascending Total", () => {
    let round = createRound(["Alice", "Bob"]);
    round = setScore(round, 0, 0, 5); // Alice 5
    round = setScore(round, 1, 0, 2); // Bob 2
    saveRound(round);

    renderResults();

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toMatch(/bob/i);
    expect(items[1]).toMatch(/alice/i);
  });

  it("crowns the lowest-Total Player the Winner in a complete Round", () => {
    let round = fullyScoredRound(["Alice", "Bob"]);
    round = setScore(round, 1, 0, 1); // Bob one stroke better
    saveRound(round);

    renderResults();

    // The champion's name headlines the screen.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/bob/i);
    // A single-winner badge names the discipline and the winning Total.
    expect(screen.getByText(/^winner · 17 strokes$/i)).toBeInTheDocument();
  });

  it('names both Players as co-Winners joined with " & " on a tie', () => {
    saveRound(fullyScoredRound(["Alice", "Bob"])); // identical Scores -> tie

    renderResults();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /alice & bob/i,
    );
    expect(screen.getByText(/^co-winners · 18 strokes$/i)).toBeInTheDocument();
  });

  it("shows NO WINNER for an incomplete Round finished early", () => {
    saveRound(setScore(createRound(["Alice", "Bob"]), 0, 0, 1));

    renderResults();

    expect(
      screen.getByRole("heading", { level: 1, name: /no winner/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/round finished early — not every hole was scored/i),
    ).toBeInTheDocument();
    // No winner badge on an incomplete Round.
    expect(screen.queryByText(/strokes/i)).toBeNull();
  });

  it("clears the active Round and returns Home on Done", async () => {
    saveRound(fullyScoredRound(["Alice"]));

    renderResults();
    await user.click(screen.getByRole("button", { name: /back to home/i }));

    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(loadRound()).toBeNull();
  });

  it("returns to the Scorecard without clearing the Round", async () => {
    saveRound(fullyScoredRound(["Alice"]));

    renderResults();
    await user.click(
      screen.getByRole("button", { name: /back to scorecard/i }),
    );

    expect(screen.getByText("SCORECARD")).toBeInTheDocument();
    // The Round stays active so the group can fix a Score.
    expect(loadRound()).not.toBeNull();
  });

  it("shows a message when there is no active Round", () => {
    renderResults();
    expect(screen.getByText(/no active round/i)).toBeInTheDocument();
  });
});
