import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Ensure a clean DOM and storage between tests.
afterEach(() => {
  cleanup()
  localStorage.clear()
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
