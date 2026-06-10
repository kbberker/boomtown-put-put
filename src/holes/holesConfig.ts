// Persistence for the fixed 9-hole course configuration.
// Hole config survives across Rounds in localStorage (see ADR-0001).

export type Hole = {
  name: string
  par: number
}

export const HOLE_COUNT = 9
export const DEFAULT_PAR = 3

const STORAGE_KEY = 'putt-putt:holes'

/** The shared-course read endpoint served by a Netlify Function (ADR-0003). */
const HOLES_ENDPOINT = '/api/holes'

/** The seed configuration used on first run: "Hole 1".."Hole 9", all par 3. */
export function defaultHoles(): Hole[] {
  return Array.from({ length: HOLE_COUNT }, (_, i) => ({
    name: `Hole ${i + 1}`,
    par: DEFAULT_PAR,
  }))
}

/**
 * Load the saved Hole configuration. On first run (nothing stored) or when the
 * stored data is missing/corrupt, seed the defaults, persist them, and return.
 */
export function loadHoles(): Hole[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw !== null) {
    const parsed = tryParseHoles(raw)
    if (parsed) return parsed
  }
  const seeded = defaultHoles()
  saveHoles(seeded)
  return seeded
}

/** Persist the Hole configuration. */
export function saveHoles(holes: Hole[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holes))
}

/**
 * Refresh the cached course from the shared store (ADR-0003): fetch
 * `GET /api/holes`, validate it, and re-cache on success so a later
 * {@link loadHoles} sees the fresh course. localStorage is a cache, not the
 * source of truth — any failure (offline, function down, invalid body) is
 * swallowed and the current cache (or built-in defaults) is returned, so live
 * scoring is never blocked on the network.
 */
export async function refreshHoles(): Promise<Hole[]> {
  try {
    const res = await fetch(HOLES_ENDPOINT)
    if (!res.ok) return loadHoles()
    const value: unknown = await res.json()
    if (!isHoleArray(value)) return loadHoles()
    saveHoles(value)
    return value
  } catch {
    return loadHoles()
  }
}

/** Outcome of a shared-course write: success, a wrong PIN, or any other error. */
export type SaveResult = { ok: true } | { ok: false; reason: 'unauthorized' | 'error' }

/**
 * Push an edited course to the shared store (ADR-0003): `PUT /api/holes` with
 * `{ pin, holes }`. The PIN is checked server-side; a 401 comes back as
 * `unauthorized` so the caller can surface "wrong PIN", and any other failure
 * (offline, function down, rejected body) as `error`. The local cache is only
 * updated on success, so a failed write leaves the current course unchanged.
 */
export async function saveSharedHoles(holes: Hole[], pin: string): Promise<SaveResult> {
  try {
    const res = await fetch(HOLES_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, holes }),
    })
    if (res.status === 401) return { ok: false, reason: 'unauthorized' }
    if (!res.ok) return { ok: false, reason: 'error' }
    saveHoles(holes)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

function tryParseHoles(raw: string): Hole[] | null {
  try {
    const value = JSON.parse(raw)
    if (!isHoleArray(value)) return null
    return value
  } catch {
    return null
  }
}

/**
 * Guard for a well-formed course: exactly {@link HOLE_COUNT} holes, each with a
 * string name and numeric par. Used to validate the cache, the fetched
 * `GET /api/holes` response, and the `PUT /api/holes` body (ADR-0003).
 */
export function isHoleArray(value: unknown): value is Hole[] {
  return (
    Array.isArray(value) &&
    value.length === HOLE_COUNT &&
    value.every(
      (h) =>
        typeof h === 'object' &&
        h !== null &&
        typeof (h as Hole).name === 'string' &&
        typeof (h as Hole).par === 'number',
    )
  )
}
