import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

function stepperFor(playerName: string) {
  return screen.getByRole('group', { name: playerName })
}

function increase(playerName: string) {
  return user.click(
    screen.getByRole('button', { name: `Increase ${playerName}'s score` }),
  )
}

function decrease(playerName: string) {
  return user.click(
    screen.getByRole('button', { name: `Decrease ${playerName}'s score` }),
  )
}

function save() {
  return user.click(screen.getByRole('button', { name: /save scores/i }))
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

  it('renders a stepper per Player instead of a number input', () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    expect(stepperFor('Alice')).toBeInTheDocument()
    expect(stepperFor('Bob')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).toBeNull()
    expect(within(stepperFor('Alice')).getByText('–')).toBeInTheDocument()
  })

  it('steps a blank Score up to 1 on the first increase', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)
    await increase('Alice')

    expect(within(stepperFor('Alice')).getByText('1')).toBeInTheDocument()
  })

  it('caps the Score at 9 and flags the pick-up', async () => {
    saveHoles(defaultHoles())
    saveRound(setScore(createRound(['Alice']), 0, 0, 8))

    renderHoleEntry(0)
    await increase('Alice')
    expect(within(stepperFor('Alice')).getByText('9')).toBeInTheDocument()
    expect(within(stepperFor('Alice')).getByText(/picked up/i)).toBeInTheDocument()

    // Already at the cap: another increase keeps 9.
    await increase('Alice')
    expect(within(stepperFor('Alice')).getByText('9')).toBeInTheDocument()
  })

  it('does not decrease below 1 or step down a blank Score', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    // Blank: decrease is a no-op.
    await decrease('Alice')
    expect(within(stepperFor('Alice')).getByText('–')).toBeInTheDocument()

    // At the minimum of 1: another decrease keeps 1.
    await increase('Alice')
    await decrease('Alice')
    expect(within(stepperFor('Alice')).getByText('1')).toBeInTheDocument()
  })

  it('persists entered Scores and returns to the Scorecard on Save', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    await increase('Alice')
    await increase('Alice')
    await increase('Alice')
    await increase('Bob')
    await save()

    expect(screen.getByText('SCORECARD')).toBeInTheDocument()
    const round = loadRound()
    expect(round?.players[0].scores[0]).toBe(3)
    expect(round?.players[1].scores[0]).toBe(1)
  })

  it('does not persist until Save is tapped', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice']))

    renderHoleEntry(0)

    await increase('Alice')

    // The stored Round is unchanged while the entry is still a draft.
    expect(loadRound()?.players[0].scores[0]).toBeNull()
  })

  it('pre-fills existing Scores when re-opening a scored Hole', () => {
    saveHoles(defaultHoles())
    saveRound(setScore(createRound(['Alice']), 0, 0, 4))

    renderHoleEntry(0)

    expect(within(stepperFor('Alice')).getByText('4')).toBeInTheDocument()
  })

  it('overwrites an existing Score when editing a re-opened Hole', async () => {
    saveHoles(defaultHoles())
    saveRound(setScore(createRound(['Alice']), 0, 0, 4))

    renderHoleEntry(0)

    await decrease('Alice')
    await decrease('Alice')
    await save()

    expect(loadRound()?.players[0].scores[0]).toBe(2)
  })

  it('blocks Save and does not persist when a Player has no Score', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)

    await increase('Alice')
    // Bob is left blank.
    await save()

    expect(screen.queryByText('SCORECARD')).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(loadRound()?.players[0].scores[0]).toBeNull()
  })

  it('counts the Players scored so far in the helper line', async () => {
    saveHoles(defaultHoles())
    saveRound(createRound(['Alice', 'Bob']))

    renderHoleEntry(0)
    expect(screen.getByText(/0 of 2 scored/i)).toBeInTheDocument()

    await increase('Alice')
    expect(screen.getByText(/1 of 2 scored/i)).toBeInTheDocument()
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
