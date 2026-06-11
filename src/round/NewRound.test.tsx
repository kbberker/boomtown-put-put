import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { NewRound } from "./NewRound";
import { createRound, loadRound, saveRound } from "./roundModel";

const user = userEvent.setup();

function renderNewRound() {
  render(
    <MemoryRouter initialEntries={["/new-round"]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/new-round" element={<NewRound />} />
        <Route path="/scorecard" element={<div>SCORECARD</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function playerInputs() {
  return screen.getAllByLabelText(/player \d name/i) as HTMLInputElement[];
}

function teeOff() {
  return user.click(screen.getByRole("button", { name: /tee off/i }));
}

describe("NewRound", () => {
  it("starts with pre-filled, editable Player names", () => {
    renderNewRound();
    const inputs = playerInputs();
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(inputs[0]).toHaveValue("Player 1");
  });

  it("adds Players up to a roster of 6, pre-filling each new name", async () => {
    renderNewRound();

    while (playerInputs().length < 6) {
      await user.click(screen.getByRole("button", { name: /add player/i }));
    }
    expect(playerInputs()).toHaveLength(6);
    expect(playerInputs()[5]).toHaveValue("Player 6");
    // Cannot exceed the maximum roster of 6 — the add affordance goes away.
    expect(screen.queryByRole("button", { name: /add player/i })).toBeNull();
  });

  it("removes Players down to a roster of 1", async () => {
    renderNewRound();

    while (playerInputs().length > 1) {
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await user.click(removeButtons[removeButtons.length - 1]);
    }
    expect(playerInputs()).toHaveLength(1);
    // Cannot drop below a single Player.
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });

  it("selects the pre-filled name on focus so typing replaces it", async () => {
    renderNewRound();

    await user.click(playerInputs()[0]);
    await user.keyboard("Sam");

    expect(playerInputs()[0]).toHaveValue("Sam");
  });

  it("starts a Round with the edited roster, allowing duplicate names", async () => {
    renderNewRound();

    const inputs = playerInputs();
    await user.clear(inputs[0]);
    await user.type(inputs[0], "Sam");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "Sam");

    await teeOff();

    const round = loadRound();
    expect(round?.players.map((p) => p.name)).toEqual(["Sam", "Sam"]);
    expect(screen.getByText("SCORECARD")).toBeInTheDocument();
  });

  it("returns home without creating a Round when the Home link is used", async () => {
    renderNewRound();

    await user.click(screen.getByRole("link", { name: /home/i }));

    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(loadRound()).toBeNull();
  });

  it("blocks the tee-off and does not create a Round when a name is empty", async () => {
    renderNewRound();

    await user.clear(playerInputs()[0]);
    await teeOff();

    expect(screen.queryByText("SCORECARD")).toBeNull();
    expect(loadRound()).toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("warns and marks the field invalid when a name exceeds 12 characters", async () => {
    renderNewRound();

    await user.clear(playerInputs()[0]);
    await user.type(playerInputs()[0], "Bartholomewson");

    expect(playerInputs()[0]).toHaveValue("Bartholomewson");
    expect(playerInputs()[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/12 characters/i)).toBeInTheDocument();
  });

  it("blocks the tee-off and does not create a Round when a name is too long", async () => {
    renderNewRound();

    await user.clear(playerInputs()[0]);
    await user.type(playerInputs()[0], "Bartholomewson");
    await teeOff();

    expect(screen.queryByText("SCORECARD")).toBeNull();
    expect(loadRound()).toBeNull();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("confirms before discarding a Round in progress, then replaces it", async () => {
    saveRound(createRound(["Old Player"]));
    renderNewRound();

    await teeOff();

    // The styled confirm replaces window.confirm; nothing is discarded yet.
    expect(
      screen.getByRole("dialog", { name: /start over/i }),
    ).toBeInTheDocument();
    expect(loadRound()?.players.map((p) => p.name)).toEqual(["Old Player"]);

    await user.click(screen.getByRole("button", { name: /discard/i }));

    expect(loadRound()?.players.map((p) => p.name)).toEqual([
      "Player 1",
      "Player 2",
    ]);
    expect(screen.getByText("SCORECARD")).toBeInTheDocument();
  });

  it("keeps the Round in progress when the discard is cancelled", async () => {
    saveRound(createRound(["Old Player"]));
    renderNewRound();

    await teeOff();
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(loadRound()?.players.map((p) => p.name)).toEqual(["Old Player"]);
    expect(screen.queryByText("SCORECARD")).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not confirm when no Round is in progress", async () => {
    renderNewRound();

    await teeOff();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("SCORECARD")).toBeInTheDocument();
  });
});
