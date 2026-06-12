import { Link } from "react-router";
import { loadRound, nextUnscoredHole } from "./round/utils";
import { Shell } from "./ui/Shell";
import { ButtonLink } from "./ui/Button";
import logo from "./assets/boomtown-john-logo.png";
import styles from "./Home.module.css";

/** The app's single entry point. */
export function Home() {
  // Surface a Round in progress so a refresh-discarded tab can return to it.
  // It is offered, not auto-loaded — the Scorekeeper chooses to resume (ADR-0001).
  const round = loadRound();
  const nextHole = round === null ? null : nextUnscoredHole(round);

  return (
    <Shell felt>
      <div className={styles.layout}>
        <div className={styles.hero}>
          <img
            src={logo}
            alt="John, the Harbor Nine mascot"
            className={styles.logo}
          />
          <h1 className={styles.title}>
            Harbor
            <br />
            Nine
          </h1>
          <p className={styles.kicker}>
            <span className={styles.rule} />
            Put Put
            <span className={styles.rule} />
          </p>
        </div>

        <div className={styles.side}>
          {round && (
            <Link to="/scorecard" className={`${styles.resume} bt-press`}>
              <span>
                <span className={styles.resumeKicker}>Round in progress</span>
                <span className={styles.resumeLine}>
                  {nextHole === null
                    ? "ALL HOLES SCORED"
                    : `HOLE ${nextHole + 1}`}
                  {" · "}
                  {round.players.length} PLAYER
                  {round.players.length > 1 ? "S" : ""}
                </span>
              </span>
              <span className={styles.resumeChip}>Resume</span>
            </Link>
          )}

          <nav className={styles.actions}>
            <ButtonLink to="/new-round" big>
              New Round
            </ButtonLink>
            <ButtonLink to="/holes" variant="ghost-dark">
              Hole Setup
            </ButtonLink>
          </nav>
        </div>
      </div>
    </Shell>
  );
}
