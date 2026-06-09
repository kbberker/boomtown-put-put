import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { Scorecard } from './Scorecard'
import { createRound, saveRound, setScore } from './roundModel'
import { saveHoles, defaultHoles, HOLE_COUNT } from '../holes/holesConfig'

function renderScorecard() {
  render(
    <MemoryRouter>
      <Scorecard />
    </MemoryRouter>,
  )
}

// A routed render so we can assert that finishing lands on the Results screen.
function renderScorecardRouted() {
  render(
    <MemoryRouter initialEntries={['/scorecard']}>
      <Routes>
        <Route path="/scorecard" element={<Scorecard />} />
        <Route path="/results" element={<div>RESULTS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Score every Player on every Hole so the Round counts as complete.
function fullyScoredRound(names: string[]) {
  let round = createRound(names)
  round.players.forEach((_, p) => {
    for (let h = 0; h < HOLE_COUNT; h++) round = setScore(round, p, h, 2)
  })
  return round
}

describe('Scorecard', () => {
  it('renders the 9 configured Holes as columns with name and par', () => {
    const holes = defaultHoles()
    holes[0] = { name: 'The Windmill', par: 4 }
    saveHoles(holes)
    saveRound(createRound(['Alice']))

    renderScorecard()

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

    renderScorecard()

    expect(screen.getByRole('rowheader', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Bob' })).toBeInTheDocument()
  })

  it('shows every score cell blank (not yet entered)', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderScorecard()

    const blanks = screen.getAllByLabelText(/not yet entered/i)
    expect(blanks).toHaveLength(2 * HOLE_COUNT)
  })

  it('shows a running Total of 0 for every Player', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderScorecard()

    const aliceRow = screen.getByRole('row', { name: /alice/i })
    expect(within(aliceRow).getByRole('cell', { name: 'Total: 0' }))
      .toBeInTheDocument()
  })

  it('reflects entered Scores and recomputed Totals', () => {
    saveHoles(defaultHoles())
    let round = createRound(['Alice'])
    round = setScore(round, 0, 0, 3)
    round = setScore(round, 0, 1, 2)
    saveRound(round)

    renderScorecard()

    const aliceRow = screen.getByRole('row', { name: /alice/i })
    expect(within(aliceRow).getByRole('cell', { name: 'Total: 5' }))
      .toBeInTheDocument()
  })

  it('links each Hole header to its Hole Entry Page', () => {
    const holes = defaultHoles()
    holes[0] = { name: 'The Windmill', par: 4 }
    saveHoles(holes)
    saveRound(createRound(['Alice']))

    renderScorecard()

    expect(
      screen.getByRole('link', { name: /the windmill/i }),
    ).toHaveAttribute('href', '/hole/0')
  })

  it('shows each Hole as scored once every Player has a Score, else not yet', () => {
    saveHoles(defaultHoles())
    // Alice scored on Hole 1 only; Hole 2 is still blank.
    saveRound(setScore(createRound(['Alice']), 0, 0, 3))

    renderScorecard()

    const scored = screen.getByRole('columnheader', { name: /hole 1\b/i })
    expect(within(scored).getByText(/scored/i)).toBeInTheDocument()

    const notYet = screen.getByRole('columnheader', { name: /hole 2\b/i })
    expect(within(notYet).getByText(/not yet/i)).toBeInTheDocument()
  })

  it('shows a message when there is no active Round', () => {
    saveHoles(defaultHoles())
    renderScorecard()
    expect(screen.getByText(/no active round/i)).toBeInTheDocument()
  })

  describe('Finish Round', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('always offers a Finish Round action', () => {
      saveHoles(defaultHoles())
      saveRound(createRound(['Alice']))
      renderScorecard()
      expect(
        screen.getByRole('button', { name: /finish round/i }),
      ).toBeInTheDocument()
    })

    it('soft-warns about blank Holes but proceeds to Results when confirmed', async () => {
      const user = userEvent.setup()
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      saveHoles(defaultHoles())
      // Only Hole 1 scored, so 8 Holes are still blank.
      saveRound(setScore(createRound(['Alice']), 0, 0, 3))
      renderScorecardRouted()

      await user.click(screen.getByRole('button', { name: /finish round/i }))

      expect(confirm).toHaveBeenCalledWith(
        expect.stringMatching(/8 holes still blank/i),
      )
      expect(screen.getByText('RESULTS')).toBeInTheDocument()
    })

    it('stays on the Scorecard when the blank-Holes warning is dismissed', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      saveHoles(defaultHoles())
      saveRound(createRound(['Alice']))
      renderScorecardRouted()

      await user.click(screen.getByRole('button', { name: /finish round/i }))

      expect(screen.queryByText('RESULTS')).not.toBeInTheDocument()
    })

    it('finishes a complete Round straight to Results without warning', async () => {
      const user = userEvent.setup()
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      saveHoles(defaultHoles())
      saveRound(fullyScoredRound(['Alice', 'Bob']))
      renderScorecardRouted()

      await user.click(screen.getByRole('button', { name: /finish round/i }))

      expect(confirm).not.toHaveBeenCalled()
      expect(screen.getByText('RESULTS')).toBeInTheDocument()
    })
  })
})
