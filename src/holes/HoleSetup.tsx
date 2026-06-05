import { useState } from 'react'
import { loadHoles, saveHoles, type Hole } from './holesConfig'

type HoleSetupProps = {
  onBack: () => void
}

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
export function HoleSetup({ onBack }: HoleSetupProps) {
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
    onBack()
  }

  return (
    <section>
      <header>
        <h1>Hole Setup</h1>
        <button type="button" onClick={handleDone}>
          Done
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      <ol>
        {drafts.map((draft, index) => (
          <li key={index}>
            <label>
              Hole name
              <input
                type="text"
                required
                aria-invalid={draft.name.trim() === ''}
                value={draft.name}
                onChange={(e) => updateHole(index, { name: e.target.value })}
              />
            </label>
            <label>
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
          </li>
        ))}
      </ol>
    </section>
  )
}
