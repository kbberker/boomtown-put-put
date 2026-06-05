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
      screen.getByRole('heading', { name: /putt putt/i }),
    ).toBeInTheDocument()

    // Open Hole Setup.
    await user.click(screen.getByRole('link', { name: /hole setup/i }))
    expect(screen.getAllByLabelText(/hole name/i)).toHaveLength(9)

    // Done returns to Home.
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(
      screen.getByRole('heading', { name: /putt putt/i }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/hole name/i)).toBeNull()
  })
})
