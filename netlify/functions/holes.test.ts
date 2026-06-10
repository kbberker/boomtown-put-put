import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defaultHoles, type Hole } from '../../src/holes/holesConfig'

// Stand in for the Netlify Blobs store so the handler can be exercised without
// a real backend; `get` is what GET reads through.
const get = vi.fn()
vi.mock('@netlify/blobs', () => ({
  getStore: () => ({ get, set: vi.fn() }),
}))

import handler from './holes'

function getRequest() {
  return new Request('https://example.com/api/holes')
}

describe('GET /api/holes', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('returns the stored course from Blobs', async () => {
    const course: Hole[] = defaultHoles()
    course[2] = { name: 'The Windmill', par: 4 }
    get.mockResolvedValue(course)

    const res = await handler(getRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(course)
  })

  it('returns the built-in defaults when the Blob is empty', async () => {
    get.mockResolvedValue(null)

    const res = await handler(getRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(defaultHoles())
  })

  it('falls back to defaults when the stored value is invalid', async () => {
    get.mockResolvedValue({ not: 'a course' })

    const res = await handler(getRequest())

    expect(await res.json()).toEqual(defaultHoles())
  })

  it('falls back to defaults when the Blob read throws', async () => {
    get.mockRejectedValue(new Error('blobs unavailable'))

    const res = await handler(getRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(defaultHoles())
  })

  it('carries a Cache-Control header so reads are edge-cached', async () => {
    get.mockResolvedValue(null)

    const res = await handler(getRequest())

    expect(res.headers.get('Cache-Control')).toBeTruthy()
  })
})
