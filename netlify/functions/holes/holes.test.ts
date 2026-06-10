import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defaultHoles, type Hole } from '../../../src/holes/holesConfig'

// Stand in for the Netlify Blobs store so the handler can be exercised without
// a real backend; `get` is what GET reads through and `set` is what PUT writes.
const get = vi.fn()
const set = vi.fn()
vi.mock('@netlify/blobs', () => ({
  getStore: () => ({ get, set }),
}))

import handler from './holes'

function getRequest() {
  return new Request('https://example.com/api/holes')
}

function putRequest(body: unknown) {
  return new Request('https://example.com/api/holes', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/holes', () => {
  beforeEach(() => {
    get.mockReset()
    set.mockReset()
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

describe('PUT /api/holes', () => {
  const PIN = '4242'

  beforeEach(() => {
    get.mockReset()
    set.mockReset()
    process.env.HOLE_PIN = PIN
  })

  it('rejects a wrong PIN with 401 and never touches Blobs', async () => {
    const res = await handler(putRequest({ pin: 'nope', holes: defaultHoles() }))

    expect(res.status).toBe(401)
    expect(set).not.toHaveBeenCalled()
  })

  it('rejects a missing PIN with 401 and never touches Blobs', async () => {
    const res = await handler(putRequest({ holes: defaultHoles() }))

    expect(res.status).toBe(401)
    expect(set).not.toHaveBeenCalled()
  })

  it('persists the course to Blobs when the PIN is correct', async () => {
    const course: Hole[] = defaultHoles()
    course[2] = { name: 'The Windmill', par: 4 }

    const res = await handler(putRequest({ pin: PIN, holes: course }))

    expect(res.status).toBe(200)
    expect(set).toHaveBeenCalledWith('holes', JSON.stringify(course))
  })

  it('rejects a body that fails isHoleArray with 400 and never writes', async () => {
    const res = await handler(putRequest({ pin: PIN, holes: { not: 'a course' } }))

    expect(res.status).toBe(400)
    expect(set).not.toHaveBeenCalled()
  })
})
