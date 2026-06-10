import { type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { loadRound, clearRound, rankPlayers, isRoundComplete } from './roundModel'
import { Shell } from '../ui/Shell'
import { Button } from '../ui/Button'
import styles from './Results.module.css'

const CONFETTI_COLORS = [
  'var(--bt-yellow)',
  'var(--bt-fairway-light)',
  'var(--bt-blue)',
  'var(--bt-white)',
]

// A fixed decorative burst — one-shot and prop-independent, so it lives at
// module scope and is shared by every mount. The CSS animation only runs when
// the user hasn't asked to reduce motion.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.9,
  dur: 2.2 + Math.random() * 1.6,
  size: 7 + Math.random() * 7,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  spin: Math.random() > 0.5 ? 1 : -1,
}))

/**
 * The Results screen: the active Round's final standings on the felt, Players
 * ranked by ascending Total. A complete Round (every Player scored on every
 * Hole) crowns the lowest-Total Player(s) the Winner — co-Winners on a tie,
 * joined with " & ", with no tiebreaker — and rains a one-shot burst of
 * confetti (gated behind `prefers-reduced-motion` in CSS). A Round finished
 * early shows "NO WINNER" rather than a bogus champion and skips the confetti.
 *
 * "Done · Back to Home" clears the active Round and returns Home (only one
 * Round is active at a time — ADR-0001); "Back to Scorecard" leaves the Round
 * intact so the group can nip back and fix a Score.
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
      <Shell felt>
        <div className={styles.emptyState}>
          <p>No active Round.</p>
          <Button onClick={leave}>Back to Home</Button>
        </div>
      </Shell>
    )
  }

  const ranked = rankPlayers(round)
  const complete = isRoundComplete(round)
  const winners = ranked.filter((r) => r.isWinner)

  return (
    <Shell felt>
      {complete && (
        <div className={styles.confetti} aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={styles.confettiPiece}
              style={
                {
                  left: `${c.left}%`,
                  width: c.size,
                  height: c.size * 0.45,
                  background: c.color,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.dur}s`,
                  '--spin': c.spin,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <header className={styles.header}>
        <p className={styles.kicker}>Final Standings</p>
        {complete ? (
          <>
            <h1 className={styles.winnerName}>
              {winners.map((w) => w.player.name).join(' & ')}
            </h1>
            <span className={styles.badge}>
              {winners.length > 1 ? 'Co-Winners' : 'Winner'} ·{' '}
              {winners[0].total} strokes
            </span>
          </>
        ) : (
          <>
            <h1 className={styles.noWinner}>No Winner</h1>
            <p className={styles.subtitle}>
              Round finished early — not every hole was scored
            </p>
          </>
        )}
      </header>

      <ol className={styles.standings}>
        {ranked.map((r, i) => (
          <li
            key={i}
            className={styles.rankRow}
            data-winner={r.isWinner || undefined}
          >
            <span className={styles.rank}>{i + 1}</span>
            <span className={styles.rankName}>{r.player.name}</span>
            <span className={styles.rankTotal}>{r.total}</span>
          </li>
        ))}
      </ol>

      <div className={styles.footer}>
        <Button big onClick={leave}>
          Done · Back to Home
        </Button>
        <Button variant="ghost-dark" onClick={() => navigate('/scorecard')}>
          Back to Scorecard
        </Button>
      </div>
    </Shell>
  )
}
