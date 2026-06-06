import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewRound } from './NewRound'
import { loadRound } from './roundModel'

function playerInputs() {
  return screen.getAllByLabelText(/player name/i) as HTMLInputElement[]
}

describe('NewRound', () => {
  it('starts with pre-filled, editable Player names', () => {
    render(<NewRound onStart={() => {}} />)
    const inputs = playerInputs()
    expect(inputs.length).toBeGreaterThanOrEqual(1)
    expect(inputs[0]).toHaveValue('Player 1')
  })

  it('adds Players up to a roster of 6, pre-filling each new name', async () => {
    const user = userEvent.setup()
    render(<NewRound onStart={() => {}} />)

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
    render(<NewRound onStart={() => {}} />)

    while (playerInputs().length > 1) {
      const rows = screen.getAllByRole('listitem')
      const lastRow = rows[rows.length - 1]
      await user.click(within(lastRow).getByRole('button', { name: /remove/i }))
    }
    expect(playerInputs()).toHaveLength(1)
    // Cannot drop below a single Player.
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  it('starts a Round with the edited roster, allowing duplicate names', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<NewRound onStart={onStart} />)

    const inputs = playerInputs()
    await user.clear(inputs[0])
    await user.type(inputs[0], 'Sam')
    await user.clear(inputs[1])
    await user.type(inputs[1], 'Sam')

    await user.click(screen.getByRole('button', { name: /start round/i }))

    const round = loadRound()
    expect(round?.players.map((p) => p.name)).toEqual(['Sam', 'Sam'])
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('blocks Start and does not create a Round when a name is empty', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<NewRound onStart={onStart} />)

    await user.clear(playerInputs()[0])
    await user.click(screen.getByRole('button', { name: /start round/i }))

    expect(onStart).not.toHaveBeenCalled()
    expect(loadRound()).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
