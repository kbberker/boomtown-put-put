import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { HoleSetup } from "./HoleSetup";
import { defaultHoles, loadHoles } from "./holesConfig";

const user = userEvent.setup();

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function renderHoleSetup() {
  render(
    <MemoryRouter initialEntries={["/holes"]}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/holes" element={<HoleSetup />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HoleSetup", () => {
  it("renders the 9 seeded holes with default names and par on first run", () => {
    renderHoleSetup();
    const names = screen.getAllByLabelText(/hole name/i) as HTMLInputElement[];
    expect(names).toHaveLength(9);
    expect(names[0]).toHaveValue("Hole 1");
    expect(names[8]).toHaveValue("Hole 9");

    const pars = screen.getAllByLabelText(/par/i) as HTMLInputElement[];
    expect(pars).toHaveLength(9);
    expect(pars.every((p) => p.value === "3")).toBe(true);
  });

  it("does not persist edits until Done is clicked", async () => {
    renderHoleSetup();

    const firstName = screen.getAllByLabelText(/hole name/i)[0];
    await user.clear(firstName);
    await user.type(firstName, "The Windmill");

    // Nothing saved yet — storage still holds the seeded default.
    expect(loadHoles()[0].name).toBe("Hole 1");
  });

  it("saves the course to the shared store with the PIN and navigates home", async () => {
    const expected = defaultHoles();
    expected[0] = { name: "The Windmill", par: 4 };
    stubFetch(() => Promise.resolve(jsonResponse(expected)));
    renderHoleSetup();

    const firstName = screen.getAllByLabelText(/hole name/i)[0];
    const firstPar = screen.getAllByLabelText(/par/i)[0];
    await user.clear(firstName);
    await user.type(firstName, "The Windmill");
    await user.clear(firstPar);
    await user.type(firstPar, "4");
    await user.type(screen.getByLabelText(/pin/i), "4242");

    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(await screen.findByText("HOME")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/holes",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ pin: "4242", holes: expected }),
      }),
    );
    // saveSharedHoles re-caches on success, so the local cache now agrees.
    expect(loadHoles()[0]).toEqual({ name: "The Windmill", par: 4 });
  });

  it("surfaces an error and leaves the course unchanged when the PIN is wrong", async () => {
    stubFetch(() => Promise.resolve(jsonResponse("Unauthorized", 401)));
    renderHoleSetup();

    await user.clear(screen.getAllByLabelText(/hole name/i)[0]);
    await user.type(screen.getAllByLabelText(/hole name/i)[0], "The Windmill");
    await user.type(screen.getByLabelText(/pin/i), "wrong");
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("HOME")).toBeNull();
    // Nothing was persisted: the shared course is untouched.
    expect(loadHoles()[0].name).toBe("Hole 1");
  });

  it("remembers the PIN in sessionStorage but never localStorage after a save", async () => {
    stubFetch(() => Promise.resolve(jsonResponse(defaultHoles())));
    renderHoleSetup();

    await user.type(screen.getByLabelText(/pin/i), "4242");
    await user.click(screen.getByRole("button", { name: /done/i }));

    await screen.findByText("HOME");
    expect(sessionStorage.getItem("putt-putt:pin")).toBe("4242");
    expect(localStorage.getItem("putt-putt:pin")).toBeNull();
  });

  it("pre-fills the PIN remembered for the editing tab", () => {
    sessionStorage.setItem("putt-putt:pin", "4242");
    renderHoleSetup();
    expect(screen.getByLabelText(/pin/i)).toHaveValue("4242");
  });

  it("blocks Done and does not persist when a hole name is empty", async () => {
    renderHoleSetup();

    await user.clear(screen.getAllByLabelText(/hole name/i)[0]);
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.queryByText("HOME")).toBeNull();
    expect(loadHoles()[0].name).toBe("Hole 1");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("blocks Done and does not persist when a par is empty", async () => {
    renderHoleSetup();

    await user.clear(screen.getAllByLabelText(/par/i)[0]);
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.queryByText("HOME")).toBeNull();
    expect(loadHoles()[0].par).toBe(3);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
