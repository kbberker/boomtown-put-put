import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Home } from './Home'

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
})
