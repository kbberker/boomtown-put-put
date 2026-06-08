import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  loadRound,
  saveRound,
  setScore,
  MIN_SCORE,
  MAX_SCORE,
  type Round,
} from './roundModel'
import { loadHoles } from '../holes/holesConfig'

/** Parse a draft input into a valid Score (1–9 integer), or null if invalid. */
function parseScore(raw: string): number | null {
  if (raw.trim() === '') return null
  const value = Number(raw)
  if (!Number.isInteger(value)) return null
  if (value < MIN_SCORE || value > MAX_SCORE) return null
  return value
}

/**
 * The Hole Entry Page: the per-Hole screen for entering every Player's Score on
 * a single Hole. Opened from the Scorecard via /hole/:holeIndex, showing the
 * Hole's name and par as context. Each Player gets a number input for their
 * Score (1–9; 9 means picked up). The entry is a draft held in local state and
 * only persisted on Save, which requires every Player to have a valid Score and
 * then returns to the Scorecard. Re-opening a scored Hole pre-fills the existing
 * Scores.
 *
 * The score input is intentionally isolated to this screen (see the "To be
 * discussed" note in CLAUDE.md on styling); it is a plain native control for now
 * and can be swapped later without touching the score model.
 */
export function HoleEntry() {
  const navigate = useNavigate()
  const { holeIndex: holeIndexParam } = useParams()
  const holeIndex = Number(holeIndexParam)

  const round = loadRound()
  const holes = loadHoles()
  const hole = holes[holeIndex]

  // Draft Scores for this Hole as raw input strings, one per Player, seeded from
  // any existing Scores so re-opening a scored Hole shows the current values.
  const [draft, setDraft] = useState<string[]>(() =>
    round
      ? round.players.map((p) => {
          const score = p.scores[holeIndex]
          return score === null || score === undefined ? '' : String(score)
        })
      : [],
  )
  const [error, setError] = useState<string | null>(null)
  // Only flag invalid inputs once the Scorekeeper has attempted to Save, so a
  // freshly opened (blank) Hole does not announce every field as invalid.
  const [submitted, setSubmitted] = useState(false)

  if (!round) {
    return (
      <section>
        <h1>Hole Entry</h1>
        <p>No active Round.</p>
      </section>
    )
  }

  if (!hole) {
    return (
      <section>
        <h1>Hole Entry</h1>
        <p>No such Hole.</p>
      </section>
    )
  }

  // round/hole are narrowed to non-null above; capture so the Save closure keeps
  // the narrowing.
  const activeRound = round

  function updateScore(playerIndex: number, value: string) {
    setDraft((current) =>
      current.map((s, i) => (i === playerIndex ? value : s)),
    )
  }

  function handleSave() {
    setSubmitted(true)
    const parsed = draft.map(parseScore)
    if (parsed.some((value) => value === null)) {
      setError('Every Player needs a Score from 1 to 9.')
      return
    }
    let updated: Round = activeRound
    parsed.forEach((value, playerIndex) => {
      updated = setScore(updated, playerIndex, holeIndex, value as number)
    })
    saveRound(updated)
    navigate('/scorecard')
  }

  return (
    <section>
      <header>
        <button type="button" onClick={() => navigate('/scorecard')}>
          Back to Scorecard
        </button>
        <h1>{hole.name}</h1>
        <p>Par {hole.par}</p>
        <button type="button" onClick={handleSave}>
          Save
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      <fieldset>
        <legend>Scores</legend>
        {round.players.map((player, playerIndex) => (
          <div key={playerIndex}>
            <label>
              {player.name}
              <input
                type="number"
                min={MIN_SCORE}
                max={MAX_SCORE}
                required
                inputMode="numeric"
                aria-invalid={submitted && parseScore(draft[playerIndex]) === null}
                value={draft[playerIndex]}
                onChange={(e) => updateScore(playerIndex, e.target.value)}
              />
            </label>
          </div>
        ))}
      </fieldset>
    </section>
  )
}
