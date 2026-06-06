import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Scorecard } from './Scorecard'
import { createRound, saveRound } from './roundModel'
import { saveHoles, defaultHoles, HOLE_COUNT } from '../holes/holesConfig'

describe('Scorecard', () => {
  it('renders the 9 configured Holes as columns with name and par', () => {
    const holes = defaultHoles()
    holes[0] = { name: 'The Windmill', par: 4 }
    saveHoles(holes)
    saveRound(createRound(['Alice']))

    render(<Scorecard />)

    const headers = screen.getAllByRole('columnheader')
    // Player + 9 Holes + Total
    expect(headers).toHaveLength(HOLE_COUNT + 2)
    expect(
      screen.getByRole('columnheader', { name: /the windmill/i }),
    ).toHaveTextContent(/par 4/i)
  })

  it('renders a row per Player using their name', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    render(<Scorecard />)

    expect(screen.getByRole('rowheader', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Bob' })).toBeInTheDocument()
  })

  it('shows every score cell blank (not yet entered)', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    render(<Scorecard />)

    const blanks = screen.getAllByLabelText(/not yet entered/i)
    expect(blanks).toHaveLength(2 * HOLE_COUNT)
  })

  it('shows a running Total of 0 for every Player', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    render(<Scorecard />)

    const aliceRow = screen.getByRole('row', { name: /alice/i })
    expect(within(aliceRow).getByRole('cell', { name: 'Total: 0' }))
      .toBeInTheDocument()
  })

  it('shows a message when there is no active Round', () => {
    saveHoles(defaultHoles())
    render(<Scorecard />)
    expect(screen.getByText(/no active round/i)).toBeInTheDocument()
  })
})
