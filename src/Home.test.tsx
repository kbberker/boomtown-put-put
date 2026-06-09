import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Home } from './Home'
import { createRound, saveRound } from './round/roundModel'

describe('Home', () => {
  it('renders as the entry point with the app title', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /putt putt/i }),
    ).toBeInTheDocument()
  })

  it('links to the New Round route', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /new round/i })).toHaveAttribute(
      'href',
      '/new-round',
    )
  })

  it('links to the Hole Setup route', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /hole setup/i })).toHaveAttribute(
      'href',
      '/holes',
    )
  })

  it('shows a Resume Round action to the Scorecard when an active Round exists', () => {
    saveRound(createRound(['Sam', 'Alex']))
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('link', { name: /resume round/i }),
    ).toHaveAttribute('href', '/scorecard')
    // Resume is the primary action — first in focus/source order, ahead of New Round.
    expect(screen.getAllByRole('link')[0]).toHaveAccessibleName(/resume round/i)
    // The Round is surfaced, not auto-loaded: Home stays on Home.
    expect(
      screen.getByRole('heading', { name: /putt putt/i }),
    ).toBeInTheDocument()
  })

  it('hides the Resume Round action when no active Round exists', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: /resume round/i })).toBeNull()
  })
})
