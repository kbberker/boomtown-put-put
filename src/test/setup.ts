import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Background config refreshes (ADR-0003) hit `fetch`. By default make it hang so
// the stale-while-revalidate refresh stays inert and tests render purely from
// the cache; tests that exercise the refresh stub `fetch` explicitly.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  )
})

// Ensure a clean DOM, storage, and globals between tests.
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

// jsdom reflects <dialog open> but doesn't implement the imperative API yet;
// minimal stand-ins so components can drive the native element in tests.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
