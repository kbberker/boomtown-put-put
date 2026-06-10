# Shared Hole configuration via Netlify, KV behind a thin serverless API

We deploy the app as a **static Vite build on Netlify** and promote the **Hole
configuration** from localStorage-only to a **single shared record** so everyone
playing reads the same course names and pars. The config lives in **Netlify
Blobs** (a built-in key-value store) behind two **Netlify Functions** —
`GET /api/holes` (public read) and `PUT /api/holes` (writes gated by a PIN
compared against a deploy-secret env var). The active Round stays entirely local;
only the Hole config goes remote. This amends ADR-0001 for the Hole config:
`localStorage` is now a **cache**, not the source of truth.

## Considered Options

- **Pure static frontend with a build-time PIN — rejected.** Anything shipped to
  the browser is readable in devtools, so a "secret" PIN inlined at build time is
  not secret. Honouring "the PIN is a deploy secret" *requires* server-side
  execution. This is why a server-side component exists at all.
- **Model A: thin serverless API — chosen.** Two functions in front of the
  store; the browser never sees the DB or the PIN. Maps the "PIN as a deploy
  secret" requirement 1:1, keeps the DB swappable, and needs no row-level
  security to learn.
- **Model B: BaaS direct (Supabase / Firebase) — rejected for now.** Client
  talks to the DB via SDK with row-level security. A hardcoded PIN does not map
  to RLS without adding an edge function / RPC or switching to real auth — more
  moving parts for features (history, auth) we deliberately deferred. Revisit if
  Round history / multi-device becomes real.
- **KV/blob vs a real SQL DB — KV chosen.** The data is one ~200-byte JSON
  document with no relations; KV is right-sized. SQL (Turso / Neon / D1) is
  deferred as a learning step; because the store sits behind the function seam,
  the swap is a one-helper change (`getHoles()`/`saveHoles()`) with no frontend
  impact.

## Consequences

- **localStorage becomes a cache.** Reads are cache-first / stale-while-
  revalidate: render cached config (or the built-in 9 defaults) instantly, fetch
  `GET /api/holes` in the background, re-cache on success. Offline or
  function-down silently keeps the cached/default course — live scoring never
  blocks on the network, preserving ADR-0001's resilience rationale.
- **Seeding is implicit.** The Blob starts empty; `GET` returns the built-in
  defaults until a PIN-holder writes a real course. No manual seeding step.
- **Write security is deliberately light.** A short PIN is accepted; severity is
  low (worst case: a recoverable hole-name edit). `PUT` checks the PIN (constant-
  time) **before any Blob op**, so failed / brute-force writes cost only bare
  invocations. The PIN is remembered in `sessionStorage` for the editing tab,
  never in `localStorage`.
- **Cost is capped, not throttled.** Staying on the free plan with no payment
  method is the hard ceiling; edge-cached `GET` absorbs read-floods at the CDN;
  early-exit `PUT` keeps failed writes cheap. No rate-limiting code — on
  serverless a throttle still runs the function per request, so it would not
  shield invocation cost anyway.
- **Concurrency is last-write-wins** — a single PIN-holder makes simultaneous
  edits a non-scenario.
- **One validator, three call sites.** The existing `isHoleArray` guard validates
  the cache, the fetched response, and the `PUT` body.
- **The design is safe to publish.** No secret lives in this ADR or the repo;
  only the PIN *value* is secret (in Netlify env, never committed). Defenses do
  not rely on hiding the architecture.
