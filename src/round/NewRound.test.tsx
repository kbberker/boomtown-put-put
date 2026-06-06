import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { NewRound } from './NewRound'
import { loadRound } from './roundModel'

function renderNewRound() {
  render(
    <MemoryRouter initialEntries={['/new-round']}>
      <Routes>
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/new-round" element={<NewRound />} />
        <Route path="/scorecard" element={<div>SCORECARD</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function playerInputs() {
  return screen.getAllByLabelText(/player name/i) as HTMLInputElement[]
}

describe('NewRound', () => {
  it('starts with pre-filled, editable Player names', () => {
    renderNewRound()
    const inputs = playerInputs()
    expect(inputs.length).toBeGreaterThanOrEqual(1)
    expect(inputs[0]).toHaveValue('Player 1')
  })

  it('adds Players up to a roster of 6, pre-filling each new name', async () => {
    const user = userEvent.setup()
    renderNewRound()

    const add = screen.getByRole('button', { name: /add player/i })
    while (playerInputs().length < 6) {
      await user.click(add)
    }
    expect(playerInputs()).toHaveLength(6)
    expect(playerInputs()[5]).toHaveValue('Player 6')
    // Cannot exceed the maximum roster of 6.
    expect(add).toBeDisabled()
  })

  it('removes Players down to a roster of 1', async () => {
    const user = userEvent.setup()
    renderNewRound()

    while (playerInputs().length > 1) {
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[removeButtons.length - 1])
    }
    expect(playerInputs()).toHaveLength(1)
    // Cannot drop below a single Player.
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  it('starts a Round with the edited roster, allowing duplicate names', async () => {
    const user = userEvent.setup()
    renderNewRound()

    const inputs = playerInputs()
    await user.clear(inputs[0])
    await user.type(inputs[0], 'Sam')
    await user.clear(inputs[1])
    await user.type(inputs[1], 'Sam')

    await user.click(screen.getByRole('button', { name: /start round/i }))

    const round = loadRound()
    expect(round?.players.map((p) => p.name)).toEqual(['Sam', 'Sam'])
    expect(screen.getByText('SCORECARD')).toBeInTheDocument()
  })

  it('returns home without creating a Round when Back is clicked', async () => {
    const user = userEvent.setup()
    renderNewRound()

    await user.click(screen.getByRole('button', { name: /back to home/i }))

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(loadRound()).toBeNull()
  })

  it('blocks Start and does not create a Round when a name is empty', async () => {
    const user = userEvent.setup()
    renderNewRound()

    await user.clear(playerInputs()[0])
    await user.click(screen.getByRole('button', { name: /start round/i }))

    expect(screen.queryByText('SCORECARD')).toBeNull()
    expect(loadRound()).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
