import { Link } from 'react-router'

/** The app's single entry point. */
export function Home() {
  return (
    <section>
      <h1>Boomtown Putt Putt</h1>
      <Link to="/holes">Hole Setup</Link>
    </section>
  )
}
