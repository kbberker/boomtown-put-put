import { Link } from 'react-router'
import { loadRound } from './round/roundModel'

/** The app's single entry point. */
export function Home() {
  // Surface a Round in progress so a refresh-discarded tab can return to it.
  // It is offered, not auto-loaded — the Scorekeeper chooses to resume (ADR-0001).
  const hasActiveRound = loadRound() !== null

  return (
    <section>
      <h1>Boomtown Putt Putt</h1>
      <nav>
        {hasActiveRound && <Link to="/scorecard">Resume Round</Link>}
        <Link to="/new-round">New Round</Link>
        <Link to="/holes">Hole Setup</Link>
      </nav>
    </section>
  )
}
