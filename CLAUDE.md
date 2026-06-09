# CLAUDE.md

## Tech stack & layout

- **Stack:** React 19 + TypeScript, Vite, React Router 7 (`react-router`),
  Vitest + Testing Library + jsdom. Package manager: `pnpm`.
- **Commands:** `pnpm test` (`vitest run`) for the suite, `pnpm build`
  (`tsc -b && vite build`) to typecheck + build, `pnpm lint` for eslint.
- **Source layout (`src/`):** `App.tsx` holds the `<Routes>`; `Home.tsx` is the
  entry point. Round feature lives in `src/round/` (`roundModel.ts`,
  `NewRound.tsx`, `Scorecard.tsx`, `HoleEntry.tsx`); Hole config in
  `src/holes/` (`holesConfig.ts`, `HoleSetup.tsx`). Tests sit next to source as
  `*.test.ts(x)`.

## Domain model & persistence

- **Routes:** `/` Home, `/holes` Hole Setup, `/new-round` New Round,
  `/scorecard` Scorecard (read-only hub), `/hole/:holeIndex` Hole Entry.
- **Persistence (ADR-0001):** localStorage only, no backend, no Round history.
  `roundModel.ts` owns the single active Round under key `putt-putt:round` via
  `saveRound`/`loadRound` (load returns `null` if absent/corrupt). Holes config
  persists separately in `holesConfig.ts`. There are 9 fixed Holes
  (`HOLE_COUNT`). A Score is a 1–9 integer (9 = picked up), `null` = not entered;
  `setScore` clamps and returns a new Round. `isHoleScored`/`totalFor` are
  pure helpers. Screens read state by calling `loadRound()` on render, so a
  refresh re-reads from localStorage — Scores persist on each Hole Entry Save.

## Conventions

- **Navigation:** screens self-navigate with `useNavigate`/`<Link>`; no wrapper
  route components (routes are declared flat in `App.tsx`).
- **Forms:** save-on-confirm (persist on Save/Done/Start, not per keystroke);
  required fields use `aria-invalid`, errors surface via `role="alert"`.
- **Forms grouping:** group related controls with `<fieldset>` + `<legend>`.
- **Native controls only** for now (no hand-rolled widgets) until the styling
  stack is chosen — see "To be discussed" below.
- **Tests:** Testing Library with `MemoryRouter` (use `Routes`/`Route` stubs to
  assert navigation landed); `userEvent.setup()` once per file; `src/test/setup.ts`
  clears the DOM and localStorage `afterEach`.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Decisions (ADRs)

Architectural decisions and their rationale live in `docs/adr/`:

- `0001` — localStorage-only persistence
- `0002` — styling stack: native CSS + CSS Modules, no headless UI library
