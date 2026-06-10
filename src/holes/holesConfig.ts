// Persistence for the fixed 9-hole course configuration.
// Hole config survives across Rounds in localStorage (see ADR-0001).

export type Hole = {
  name: string
  par: number
}

export const HOLE_COUNT = 9
export const DEFAULT_PAR = 3

const STORAGE_KEY = 'putt-putt:holes'

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
