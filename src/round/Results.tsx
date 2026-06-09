import { useNavigate } from 'react-router'
import { loadRound, clearRound, rankPlayers, isRoundComplete } from './roundModel'

/**
 * The Results screen: the active Round's final standings, Players ranked by
 * ascending Total. A complete Round (every Player scored on every Hole) declares
 * the lowest-Total Player(s) the Winner; ties yield co-Winners with no
 * tiebreaker. A Round finished early shows its standings but "no Winner —
 * incomplete" rather than a bogus champion. Leaving clears the active Round and
 * returns Home — only one Round is active at a time (ADR-0001).
 */
export function Results() {
  const navigate = useNavigate()
  const round = loadRound()

  function leave() {
    clearRound()
    navigate('/')
  }

  if (!round) {
    return (
      <section>
        <h1>Results</h1>
        <p>No active Round.</p>
        <button type="button" onClick={leave}>
          Back to Home
        </button>
      </section>
    )
  }

  const ranked = rankPlayers(round)
  const winners = ranked.filter((r) => r.isWinner).map((r) => r.player.name)

  return (
    <section>
      <h1>Results</h1>

      {isRoundComplete(round) ? (
        <p>
          {winners.length > 1 ? 'Co-Winners' : 'Winner'}: {winners.join(', ')}
        </p>
      ) : (
        <p>No Winner — incomplete</p>
      )}

      <ol>
        {ranked.map((r, index) => (
          <li key={index}>
            {r.player.name} — Total {r.total}
            {r.isWinner ? ' (Winner)' : ''}
          </li>
        ))}
      </ol>

      <button type="button" onClick={leave}>
        Back to Home
      </button>
    </section>
  )
}
