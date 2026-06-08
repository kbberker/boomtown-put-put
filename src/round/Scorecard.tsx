import { Link } from 'react-router'
import { loadRound, totalFor, isHoleScored } from './roundModel'
import { loadHoles } from '../holes/holesConfig'

/**
 * The Scorecard: the read-only hub for the active Round. Players are rows and
 * the 9 configured Holes are columns, using each Hole's name and par. Cells with
 * no Score show as "not yet entered" and each Player's running Total is shown.
 * Each Hole header links to its Hole Entry Page and shows whether the Hole is
 * fully scored or not yet entered; Holes may be entered in any order.
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
            {holes.map((hole, index) => {
              const scored = isHoleScored(round, index)
              return (
                <th key={index} scope="col">
                  <Link to={`/hole/${index}`}>
                    {hole.name} (Par {hole.par})
                  </Link>{' '}
                  <span aria-label={scored ? 'fully scored' : 'not yet scored'}>
                    {scored ? 'Scored' : 'Not yet'}
                  </span>
                </th>
              )
            })}
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
