import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { HoleEntry } from './HoleEntry'
import { createRound, saveRound, loadRound, setScore } from './roundModel'
import { saveHoles, defaultHoles } from '../holes/holesConfig'

const user = userEvent.setup()

function renderHoleEntry(holeIndex: number) {
  render(
    <MemoryRouter initialEntries={[`/hole/${holeIndex}`]}>
      <Routes>
        <Route path="/hole/:holeIndex" element={<HoleEntry />} />
        <Route path="/scorecard" element={<div>SCORECARD</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function scoreInput(playerName: string) {
  return screen.getByRole('spinbutton', { name: playerName }) as HTMLInputElement
}

describe('HoleEntry', () => {
  it('shows the Hole name and par as context', () => {
    const holes = defaultHoles()
    holes[0] = { name: 'The Windmill', par: 4 }
    saveHoles(holes)
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    expect(
      screen.getByRole('heading', { name: /the windmill/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/par 4/i)).toBeInTheDocument()
  })

  it('renders a 1-9 number input per Player', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    const alice = scoreInput('Alice')
    expect(alice).toHaveAttribute('type', 'number')
    expect(alice).toHaveAttribute('min', '1')
    expect(alice).toHaveAttribute('max', '9')
    expect(alice).toBeRequired()
    expect(scoreInput('Bob')).toBeInTheDocument()
  })

  it('persists entered Scores and returns to the Scorecard on Save', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    await user.type(scoreInput('Alice'), '3')
    await user.type(scoreInput('Bob'), '5')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('SCORECARD')).toBeInTheDocument()
    const round = loadRound()
    expect(round?.players[0].scores[0]).toBe(3)
    expect(round?.players[1].scores[0]).toBe(5)
  })

  it('does not persist until Save is tapped', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    await user.type(scoreInput('Alice'), '3')

    // The stored Round is unchanged while the entry is still a draft.
    expect(loadRound()?.players[0].scores[0]).toBeNull()
  })

  it('pre-fills existing Scores when re-opening a scored Hole', () => {
    saveHoles(defaultHoles())
    saveRound(setScore(createRound(['Alice']), 0, 0, 4))

    renderHoleEntry(0)

    expect(scoreInput('Alice')).toHaveValue(4)
  })

  it('overwrites an existing Score when editing a re-opened Hole', async () => {
    saveHoles(defaultHoles())
    saveRound(setScore(createRound(['Alice']), 0, 0, 4))

    renderHoleEntry(0)

    await user.clear(scoreInput('Alice'))
    await user.type(scoreInput('Alice'), '2')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(loadRound()?.players[0].scores[0]).toBe(2)
  })

  it('blocks Save and does not persist when a Player has no Score', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    await user.type(scoreInput('Alice'), '3')
    // Bob is left blank.
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.queryByText('SCORECARD')).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(loadRound()?.players[0].scores[0]).toBeNull()
  })

  it('blocks Save when a Score is out of the 1-9 range', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    await user.type(scoreInput('Alice'), '12')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.queryByText('SCORECARD')).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(loadRound()?.players[0].scores[0]).toBeNull()
  })

  it('does not flag inputs as invalid before a Save attempt', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    // Blank on open is a draft, not an error, until the Scorekeeper tries Save.
    expect(scoreInput('Alice')).toHaveAttribute('aria-invalid', 'false')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(scoreInput('Alice')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a message when there is no active Round', () => {
    saveHoles(defaultHoles())
    renderHoleEntry(0)
    expect(screen.getByText(/no active round/i)).toBeInTheDocument()
  })

  it('shows a message when the Hole index is out of range', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))
    renderHoleEntry(99)
    expect(screen.getByText(/no such hole/i)).toBeInTheDocument()
  })
})
