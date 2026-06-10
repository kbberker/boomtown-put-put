# localStorage-only persistence, no Round history

For the MVP we persist both the Hole configuration and the single active Round
in `localStorage`, with no backend and no history of completed Rounds. This
keeps the app a synchronous, single-device frontend with zero infrastructure,
while still surviving a browser refresh mid-Round (the Scorekeeper is on a phone
walking a backyard course, where tabs get discarded from memory).

## Considered Options

- **Pure in-memory component state** — simplest, but a refresh or backgrounded
  mobile tab wipes an in-progress Round. Rejected: that failure happens in
  exactly the moment scores matter.
- **A backend (Supabase / Firebase / Turso)** — enables history, multi-device,
  and per-Player stats, but adds auth, async data flow, and infrastructure that
  the MVP does not need. Deferred to a future iteration.
- **localStorage for active Round + config, no history** — chosen. Crash-
  recovery without infrastructure.

## Consequences

- Only one Round is active at a time; starting a new Round discards the
  in-progress one. There is no way to look back at past Rounds.
- All data is single-device and single-browser — clearing site data loses
  everything, including Hole configuration.
- Adding Round history or per-Player stats later means introducing a real data
  store and migrating off `localStorage` — a deliberate, non-trivial step, not a
  config toggle. This is why the boundary is recorded here.

## Update — Hole config superseded by ADR-0003

The Hole-configuration half of this decision is superseded by **ADR-0003**: the
course is now a single shared record stored remotely (Netlify Blobs behind a
serverless API), so anyone playing reads the same names and pars. `localStorage`
is demoted from source of truth to a **cache** for the Hole config (cache-first
reads, offline falls back to cache then built-in defaults). The **active Round**
is unchanged — it remains localStorage-only and single-device, and the
crash-recovery rationale above still holds for it.
