import { useState } from 'react'
import { createRound, saveRound, MIN_PLAYERS, MAX_PLAYERS } from './roundModel'

type NewRoundProps = {
  onStart: () => void
}

const INITIAL_PLAYER_COUNT = 2

function defaultName(index: number): string {
  return `Player ${index + 1}`
}

function initialNames(): string[] {
  return Array.from({ length: INITIAL_PLAYER_COUNT }, (_, i) => defaultName(i))
}

/**
 * The New Round flow: the Scorekeeper assembles a roster of 1–6 Players with
 * pre-filled, editable names (duplicates allowed), then starts. Starting locks
 * the roster into a fresh Round and persists it as the active Round.
 */
export function NewRound({ onStart }: NewRoundProps) {
  const [names, setNames] = useState<string[]>(initialNames)
  const [error, setError] = useState<string | null>(null)

  function updateName(index: number, value: string) {
    setNames((current) => current.map((n, i) => (i === index ? value : n)))
  }

  function addPlayer() {
    setNames((current) =>
      current.length >= MAX_PLAYERS
        ? current
        : [...current, defaultName(current.length)],
    )
  }

  function removePlayer(index: number) {
    setNames((current) =>
      current.length <= MIN_PLAYERS
        ? current
        : current.filter((_, i) => i !== index),
    )
  }

  function handleStart() {
    if (!names.every((n) => n.trim() !== '')) {
      setError('Every Player needs a name.')
      return
    }
    saveRound(createRound(names))
    onStart()
  }

  return (
    <section>
      <header>
        <h1>New Round</h1>
        <button type="button" onClick={handleStart}>
          Start Round
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      <ol>
        {names.map((name, index) => (
          <li key={index}>
            <label>
              Player name
              <input
                type="text"
                required
                aria-invalid={name.trim() === ''}
                value={name}
                onChange={(e) => updateName(index, e.target.value)}
              />
            </label>
            {names.length > MIN_PLAYERS && (
              <button type="button" onClick={() => removePlayer(index)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={addPlayer}
        disabled={names.length >= MAX_PLAYERS}
      >
        Add Player
      </button>
    </section>
  )
}
