import { Link } from 'react-router'

/** The app's single entry point. */
export function Home() {
  return (
    <section>
      <h1>Boomtown Putt Putt</h1>
      <nav>
        <Link to="/new-round">New Round</Link>
        <Link to="/holes">Hole Setup</Link>
      </nav>
    </section>
  )
}
