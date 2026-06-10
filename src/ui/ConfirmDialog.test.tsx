import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

const user = userEvent.setup()

function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      open
      title="Start over?"
      body="This discards your round in progress."
      confirmLabel="Start over"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('is not shown while closed', () => {
    renderDialog({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the title, body, and action labels when open', () => {
    renderDialog()
    expect(
      screen.getByRole('dialog', { name: 'Start over?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('This discards your round in progress.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Start over' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('invokes onConfirm when the confirm button is pressed', async () => {
    const { onConfirm, onCancel } = renderDialog()
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('invokes onCancel when the cancel button is pressed', async () => {
    const { onConfirm, onCancel } = renderDialog()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('invokes onCancel when the dialog is dismissed natively (Esc)', () => {
    const { onCancel } = renderDialog()
    // Esc surfaces as the native `cancel` event on the <dialog>.
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    )
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('invokes onCancel when the backdrop is clicked', () => {
    const { onCancel } = renderDialog()
    // Backdrop clicks register on the <dialog> element itself.
    fireEvent.click(screen.getByRole('dialog'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('stays open when the card content is clicked', async () => {
    const { onConfirm, onCancel } = renderDialog()
    await user.click(screen.getByText('This discards your round in progress.'))
    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('closes once the open prop turns false', () => {
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Finish early?"
        body="3 holes are still blank."
        confirmLabel="Finish"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    rerender(
      <ConfirmDialog
        open={false}
        title="Finish early?"
        body="3 holes are still blank."
        confirmLabel="Finish"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
