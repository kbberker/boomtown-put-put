import { loadRound, totalFor } from './roundModel'
import { loadHoles } from '../holes/holesConfig'

/**
 * The Scorecard: the read-only hub for the active Round. Players are rows and
 * the 9 configured Holes are columns, using each Hole's name and par. Cells with
 * no Score show as "not yet entered" and each Player's running Total is shown.
 */
export function Scorecard() {
  const round = loadRound()
  const holes = loadHoles()

  if (!round) {
    return (
      <section>
        <h1>Scorecard</h1>
        <p>No active Round.</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Scorecard</h1>
      <table>
        <thead>
          <tr>
            <th scope="col">Player</th>
            {holes.map((hole, index) => (
              <th key={index} scope="col">
                {hole.name} (Par {hole.par})
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {round.players.map((player, playerIndex) => (
            <tr key={playerIndex}>
              <th scope="row">{player.name}</th>
              {player.scores.map((score, holeIndex) =>
                score === null ? (
                  <td key={holeIndex} aria-label="not yet entered">
                    —
                  </td>
                ) : (
                  <td key={holeIndex}>{score}</td>
                ),
              )}
              <td aria-label={`Total: ${totalFor(player)}`}>
                {totalFor(player)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
