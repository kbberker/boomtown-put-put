import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App'

const user = userEvent.setup()

describe('App navigation', () => {
  it('starts on Home and navigates to Hole Setup and back', async () => {
    // Hole Setup's Done now writes the course to the shared store before
    // returning Home (ADR-0003); stand in a successful save.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('[]', { status: 200 }))),
    )
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // Home is the entry point.
    expect(
      screen.getByRole('heading', { name: /put put/i }),
    ).toBeInTheDocument()

    // Open Hole Setup.
    await user.click(screen.getByRole('link', { name: /hole setup/i }))
    expect(screen.getAllByLabelText(/hole name/i)).toHaveLength(9)

    // A correct PIN + Done saves and returns to Home.
    await user.type(screen.getByLabelText(/pin/i), '4242')
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(
      await screen.findByRole('heading', { name: /put put/i }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/hole name/i)).toBeNull()
  })

  it('starts a Round from Home and lands on the Scorecard hub', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // Begin the New Round flow.
    await user.click(screen.getByRole('link', { name: /new round/i }))
    expect(
      screen.getByRole('heading', { name: /new round/i }),
    ).toBeInTheDocument()

    // Starting lands on the Scorecard with a row per Player.
    await user.click(screen.getByRole('button', { name: /tee off/i }))
    expect(
      screen.getByRole('heading', { name: /scorecard/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
  })

  it('preserves an in-progress Round across a reload and resumes with Scores intact', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // Start a Round and enter Scores on the first Hole.
    await user.click(screen.getByRole('link', { name: /new round/i }))
    await user.click(screen.getByRole('button', { name: /tee off/i }))
    await user.click(screen.getByRole('link', { name: /score hole 1/i }))
    const plus = (name: string) =>
      screen.getByRole('button', { name: `Increase ${name}'s score` })
    for (let i = 0; i < 3; i++) await user.click(plus('Player 1'))
    for (let i = 0; i < 5; i++) await user.click(plus('Player 2'))
    await user.click(screen.getByRole('button', { name: /save scores/i }))

    // Simulate a browser reload: tear down and mount the app fresh from Home.
    // localStorage survives, so the active Round should still be there.
    unmount()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // Home surfaces the resume strip; resuming returns to the Scorecard.
    await user.click(screen.getByRole('link', { name: /resume/i }))
    expect(
      screen.getByRole('heading', { name: /scorecard/i }),
    ).toBeInTheDocument()

    // The entered Scores survived the reload (Totals reflect them).
    expect(screen.getByLabelText('Player 1 total: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Player 2 total: 5')).toBeInTheDocument()
  })
})
