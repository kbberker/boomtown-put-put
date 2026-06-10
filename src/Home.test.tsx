import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";
import { createRound, saveRound, setScore } from "./round/roundModel";
import { HOLE_COUNT } from "./holes/holesConfig";

describe("Home", () => {
  it("renders as the entry point with the app title", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /put put/i }),
    ).toBeInTheDocument();
  });

  it("links to the New Round route", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /new round/i })).toHaveAttribute(
      "href",
      "/new-round",
    );
  });

  it("links to the Hole Setup route", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /hole setup/i })).toHaveAttribute(
      "href",
      "/holes",
    );
  });

  it("shows a resume strip to the Scorecard when an active Round exists", () => {
    saveRound(createRound(["Sam", "Alex"]));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /resume/i })).toHaveAttribute(
      "href",
      "/scorecard",
    );
    // Resume is the primary action — first in focus/source order, ahead of New Round.
    expect(screen.getAllByRole("link")[0]).toHaveAccessibleName(/resume/i);
    // The Round is surfaced, not auto-loaded: Home stays on Home.
    expect(
      screen.getByRole("heading", { name: /put put/i }),
    ).toBeInTheDocument();
  });

  it("hides the resume strip when no active Round exists", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: /resume/i })).toBeNull();
  });

  it("names the first unscored Hole (1-based) and the Player count in the resume strip", () => {
    // Hole 1 fully scored, so the Round resumes at Hole 2.
    let round = createRound(["Sam", "Alex"]);
    round = setScore(round, 0, 0, 2);
    round = setScore(round, 1, 0, 3);
    saveRound(round);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /resume/i })).toHaveTextContent(
      "HOLE 2 · 2 PLAYERS",
    );
  });

  it("uses the singular when one Player is in the Round", () => {
    saveRound(createRound(["Solo"]));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /resume/i })).toHaveTextContent(
      "HOLE 1 · 1 PLAYER",
    );
  });

  it("says all Holes are scored when none remain unscored", () => {
    let round = createRound(["Sam"]);
    for (let h = 0; h < HOLE_COUNT; h++) {
      round = setScore(round, 0, h, 2);
    }
    saveRound(round);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /resume/i })).toHaveTextContent(
      "ALL HOLES SCORED · 1 PLAYER",
    );
  });
});
