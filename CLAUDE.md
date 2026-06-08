# CLAUDE.md

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## To be discussed

Open decisions, not yet settled — raise these before investing in related work.

- **Styling stack.** Likely a headless UI library plus SCSS or CSS modules. No
  styling framework is in place yet; components currently use plain semantic HTML.
- **Mobile-first layout.** The Scorekeeper uses this on a phone while playing, so
  layouts should be designed mobile-first once the styling stack is chosen.
- **Score input control.** The Hole Entry Page uses a plain `<input type="number">`
  per Player for now. A hand-rolled 1–9 tap-button group was rejected for
  accessibility reasons; revisit a richer (but accessible) control once a headless
  UI library is adopted.
