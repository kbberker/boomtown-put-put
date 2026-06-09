import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { Results } from './Results'
import { createRound, saveRound, setScore, loadRound } from './roundModel'
import { HOLE_COUNT } from '../holes/holesConfig'

function renderResults() {
  render(
    <MemoryRouter initialEntries={['/results']}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/results" element={<Results />} />
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

describe('Results', () => {
  it('ranks Players by ascending Total', () => {
    let round = createRound(['Alice', 'Bob'])
    round = setScore(round, 0, 0, 5) // Alice 5
    round = setScore(round, 1, 0, 2) // Bob 2
    saveRound(round)

    renderResults()

    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items[0]).toMatch(/bob/i)
    expect(items[1]).toMatch(/alice/i)
  })

  it('declares the lowest-Total Player the Winner in a complete Round', () => {
    let round = fullyScoredRound(['Alice', 'Bob'])
    round = setScore(round, 1, 0, 1) // Bob one stroke better
    saveRound(round)

    renderResults()

    expect(screen.getByText(/^winner:/i)).toHaveTextContent(/bob/i)
  })

  it('names both Players as co-Winners on a tie', () => {
    saveRound(fullyScoredRound(['Alice', 'Bob'])) // identical Scores -> tie

    renderResults()

    const banner = screen.getByText(/^co-winners:/i)
    expect(banner).toHaveTextContent(/alice/i)
    expect(banner).toHaveTextContent(/bob/i)
  })

  it('shows no Winner for an incomplete Round finished early', () => {
    saveRound(setScore(createRound(['Alice', 'Bob']), 0, 0, 1))

    renderResults()

    expect(screen.getByText(/no winner — incomplete/i)).toBeInTheDocument()
  })

  it('clears the active Round and returns Home on leaving', async () => {
    const user = userEvent.setup()
    saveRound(fullyScoredRound(['Alice']))

    renderResults()
    await user.click(screen.getByRole('button', { name: /home/i }))

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(loadRound()).toBeNull()
  })

  it('shows a message when there is no active Round', () => {
    renderResults()
    expect(screen.getByText(/no active round/i)).toBeInTheDocument()
  })
})
