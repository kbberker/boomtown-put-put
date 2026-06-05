import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HoleSetup } from './HoleSetup'
import { loadHoles } from './holesConfig'

describe('HoleSetup', () => {
  it('renders the 9 seeded holes with default names and par on first run', () => {
    render(<HoleSetup onBack={() => {}} />)
    const names = screen.getAllByLabelText(/hole name/i) as HTMLInputElement[]
    expect(names).toHaveLength(9)
    expect(names[0]).toHaveValue('Hole 1')
    expect(names[8]).toHaveValue('Hole 9')

    const pars = screen.getAllByLabelText(/par/i) as HTMLInputElement[]
    expect(pars).toHaveLength(9)
    expect(pars.every((p) => p.value === '3')).toBe(true)
  })

  it('does not persist edits until Done is clicked', async () => {
    const user = userEvent.setup()
    render(<HoleSetup onBack={() => {}} />)

    const firstName = screen.getAllByLabelText(/hole name/i)[0]
    await user.clear(firstName)
    await user.type(firstName, 'The Windmill')

    // Nothing saved yet — storage still holds the seeded default.
    expect(loadHoles()[0].name).toBe('Hole 1')
  })

  it('persists all edits and navigates back when Done is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<HoleSetup onBack={onBack} />)

    const firstName = screen.getAllByLabelText(/hole name/i)[0]
    const firstPar = screen.getAllByLabelText(/par/i)[0]
    await user.clear(firstName)
    await user.type(firstName, 'The Windmill')
    await user.clear(firstPar)
    await user.type(firstPar, '4')

    await user.click(screen.getByRole('button', { name: /done/i }))

    expect(loadHoles()[0]).toEqual({ name: 'The Windmill', par: 4 })
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('blocks Done and does not persist when a hole name is empty', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<HoleSetup onBack={onBack} />)

    await user.clear(screen.getAllByLabelText(/hole name/i)[0])
    await user.click(screen.getByRole('button', { name: /done/i }))

    expect(onBack).not.toHaveBeenCalled()
    expect(loadHoles()[0].name).toBe('Hole 1')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('blocks Done and does not persist when a par is empty', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<HoleSetup onBack={onBack} />)

    await user.clear(screen.getAllByLabelText(/par/i)[0])
    await user.click(screen.getByRole('button', { name: /done/i }))

    expect(onBack).not.toHaveBeenCalled()
    expect(loadHoles()[0].par).toBe(3)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
