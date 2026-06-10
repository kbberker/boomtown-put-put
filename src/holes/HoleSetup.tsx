import { useState } from 'react'
import { useNavigate } from 'react-router'
import { loadHoles, saveHoles, type Hole } from './holesConfig'
import { Shell } from '../ui/Shell'
import { ScreenHeader } from '../ui/ScreenHeader'
import { Button } from '../ui/Button'
import styles from './HoleSetup.module.css'

// Editable form rows keep `par` as a string so the field can be cleared and
// retyped freely; we convert to a number only when saving.
type HoleDraft = {
  name: string
  par: string
}

function toDraft(hole: Hole): HoleDraft {
  return { name: hole.name, par: String(hole.par) }
}

function parsePar(par: string): number {
  return parseInt(par, 10)
}

function isValid(draft: HoleDraft): boolean {
  const par = parsePar(draft.par)
  return draft.name.trim() !== '' && !Number.isNaN(par) && par >= 1
}

/**
 * Edits the fixed 9-hole course configuration. Edits are held as local drafts
 * and persisted to localStorage only when the Scorekeeper confirms with Done,
 * which requires every hole to have a name and a par of at least 1.
 */
export function HoleSetup() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<HoleDraft[]>(() =>
    loadHoles().map(toDraft),
  )
  const [error, setError] = useState<string | null>(null)

  function updateHole(index: number, patch: Partial<HoleDraft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    )
  }

  function handleDone() {
    if (!drafts.every(isValid)) {
      setError('Every hole needs a name and a par of at least 1.')
      return
    }
    saveHoles(drafts.map((d) => ({ name: d.name.trim(), par: parsePar(d.par) })))
    navigate('/')
  }

  return (
    <Shell>
      <ScreenHeader kicker="The Course" title="Hole Setup" />

      <section className={styles.content}>
        {error && <p role="alert">{error}</p>}

        <fieldset className={styles.holes}>
          <legend className={styles.legend}>Holes</legend>
          {drafts.map((draft, index) => (
            <div key={index} className={styles.holeCard}>
              <label className={styles.nameField}>
                Hole name
                <input
                  type="text"
                  required
                  aria-invalid={draft.name.trim() === ''}
                  value={draft.name}
                  onChange={(e) => updateHole(index, { name: e.target.value })}
                />
              </label>
              <label className={styles.parField}>
                Par
                <input
                  type="number"
                  required
                  min={1}
                  max={9}
                  aria-invalid={!(parsePar(draft.par) >= 1)}
                  value={draft.par}
                  onChange={(e) => updateHole(index, { par: e.target.value })}
                />
              </label>
            </div>
          ))}
        </fieldset>
      </section>

      <div className={styles.footer}>
        <Button big onClick={handleDone}>
          Done
        </Button>
      </div>
    </Shell>
  )
}
