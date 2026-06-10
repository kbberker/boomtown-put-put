import { getStore } from '@netlify/blobs'
import { defaultHoles, isHoleArray } from '../../src/holes/holesConfig'

// The shared course lives as a single JSON document in Netlify Blobs (ADR-0003).
// The Blob starts empty; reads fall back to the built-in defaults until a
// PIN-holder writes a real course (implicit seeding — no manual seed step).
const STORE_NAME = 'course'
const KEY = 'holes'

// Public reads are absorbed at the CDN edge; a short max-age keeps the shared
// course reasonably fresh without re-invoking the function per request.
const CACHE_CONTROL = 'public, max-age=60'

/**
 * `GET /api/holes` — serve the shared course from Blobs, or the built-in
 * defaults when the Blob is empty or holds something that no longer validates.
 * `isHoleArray` guards the stored value so a corrupt Blob can never break reads.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const store = getStore(STORE_NAME)
  const stored = await store.get(KEY, { type: 'json' })
  const holes = isHoleArray(stored) ? stored : defaultHoles()

  return Response.json(holes, {
    headers: { 'Cache-Control': CACHE_CONTROL },
  })
}
