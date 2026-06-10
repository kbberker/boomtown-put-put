import { useEffect, useId, useRef } from 'react'
import styles from './ConfirmDialog.module.css'

/**
 * Styled stand-in for window.confirm, built on the native <dialog> so the
 * focus trap, Esc-to-cancel, and focus restoration to the trigger all come
 * from the platform. The parent owns `open`; both actions and the native
 * dismiss path report back through the callbacks.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  /** Red confirm button for destructive actions (e.g. discarding a Round). */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Keep `open` the single source of truth: veto the native close and
        // let the parent flip the prop instead.
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        // Only backdrop clicks target the <dialog> itself — the card wrapper
        // carries the padding, so clicks anywhere on the card hit it instead.
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className={styles.card}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.cancel} bt-press`}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirm} ${danger ? styles.danger : ''} bt-press`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
