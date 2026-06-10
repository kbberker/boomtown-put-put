# Deployment & infrastructure

Operational runbook for where this app lives and how it's wired. No secret
values belong in this file — only the topology. (For *why* the architecture is
shaped this way, see `docs/adr/0003-shared-hole-config-netlify-blobs.md`.)

## Topology

- **Domain registrar:** Cloudflare — the domain `btputput.app` was registered
  here.
- **DNS:** Cloudflare. The authoritative nameservers and records live in the
  Cloudflare dashboard, pointing the domain at the Netlify site.
- **Hosting / build:** Netlify. Builds the static Vite app (`pnpm build`,
  publish `dist/`) and runs the serverless Functions in `netlify/functions/`
  (see `netlify.toml` for the build command and `/api/*` redirects).
- **Shared data:** Netlify Blobs (store `course`, key `holes`) behind
  `GET`/`PUT /api/holes`.

## DNS wiring (Cloudflare → Netlify)

- Both `btputput.app` (apex) and `www.btputput.app` point at the Netlify site
  `[netlify-site-name].netlify.app` (CNAME / Netlify's load-balancer IP, per
  Netlify's "add a custom domain" instructions).
- **Both records are proxied through Cloudflare (orange cloud).** This is
  supported, but only with the right SSL mode — see below.

### Proxied-through-Cloudflare gotchas

- **SSL/TLS mode must be "Full (strict)".** Netlify forces HTTPS; Cloudflare's
  "Flexible" mode talks to Netlify over HTTP and creates an infinite redirect
  loop. Netlify serves a valid cert, so "Full (strict)" is correct.
- **Cert provisioning:** Netlify's automatic Let's Encrypt cert can fail to
  provision while the orange cloud is on (DNS resolves to Cloudflare IPs, so
  Netlify can't verify the domain). If it stalls, set the records to DNS-only
  (grey cloud) until Netlify shows the cert as provisioned, then re-enable the
  proxy.
- **Double CDN:** Cloudflare's cache now sits in front of Netlify's. Add a
  Cloudflare cache rule to not cache HTML (or bypass `/`) so SPA deploys aren't
  served stale. `GET /api/holes` sends `Cache-Control: public, max-age=60`,
  which Cloudflare honours — consistent with ADR-0003's edge-cached reads.

## Netlify configuration

- **Build command:** `pnpm build` · **Publish:** `dist` · **Functions:**
  `netlify/functions` (all from `netlify.toml`).
- **Environment variables** (set in Netlify UI → Site settings → Environment,
  *never committed*):
  - `HOLE_PIN` — the editor PIN gating `PUT /api/holes`. Server-side only; it is
    read via `process.env` in the Function and never shipped to the browser.
