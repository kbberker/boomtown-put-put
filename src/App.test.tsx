import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App'

describe('App navigation', () => {
  it('starts on Home and navigates to Hole Setup and back', async () => {
    const user = userEvent.setup()
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

    // Done returns to Home.
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(
      screen.getByRole('heading', { name: /put put/i }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/hole name/i)).toBeNull()
  })

  it('starts a Round from Home and lands on the Scorecard hub', async () => {
    const user = userEvent.setup()
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
    expect(
      screen.getByRole('rowheader', { name: 'Player 1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('rowheader', { name: 'Player 2' }),
    ).toBeInTheDocument()
  })

  it('preserves an in-progress Round across a reload and resumes with Scores intact', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // Start a Round and enter Scores on the first Hole.
    await user.click(screen.getByRole('link', { name: /new round/i }))
    await user.click(screen.getByRole('button', { name: /tee off/i }))
    await user.click(screen.getAllByRole('link')[0])
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
    expect(screen.getByLabelText('Total: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Total: 5')).toBeInTheDocument()
  })
})
