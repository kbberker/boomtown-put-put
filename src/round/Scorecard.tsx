import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import {
  loadRound,
  totalFor,
  isHoleScored,
  unscoredHoleCount,
  nextUnscoredHole,
  MAX_SCORE,
} from "./utils";
import { HOLE_COUNT } from "../holes/holesConfig";
import { useHoles } from "../holes/useHoles";
import { Shell } from "../ui/Shell";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Button, ButtonLink } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import styles from "./Scorecard.module.css";

/**
 * The Scorecard: the read-only hub for the active Round. Mobile-first flipped
 * grid — the 9 configured Holes are rows and Players are columns. Each Hole
 * row links to its Hole Entry Page (Holes may be entered in any order), the
 * next unscored Hole is flagged "Up next", and the totals row tracks every
 * Player's running Total with the current leader in yellow.
 *
 * Finishing is always available — backyard Rounds get abandoned mid-course.
 * If Holes are still blank we soft-warn rather than hard-block; the Results
 * screen handles an incomplete Round by declaring no Winner.
 */
export function Scorecard() {
  const navigate = useNavigate();
  const round = loadRound();
  const holes = useHoles();
  const [confirmFinish, setConfirmFinish] = useState(false);

  if (!round) {
    return (
      <Shell>
        <ScreenHeader title="Scorecard" />
        <p className={styles.emptyState}>No active Round.</p>
      </Shell>
    );
  }

  const blank = unscoredHoleCount(round);
  const nextHole = nextUnscoredHole(round);
  const totals = round.players.map(totalFor);
  const anyScores = totals.some((t) => t > 0);
  const lowest = Math.min(...totals);
  // One shared template: Hole cell + a column per Player.
  const gridStyle = { "--players": round.players.length } as CSSProperties;

  function handleFinish() {
    if (blank > 0) setConfirmFinish(true);
    else navigate("/results");
  }

  return (
    <Shell>
      <ScreenHeader
        kicker={
          blank === 0
            ? "All holes scored"
            : `${HOLE_COUNT - blank} of ${HOLE_COUNT} holes scored`
        }
        title="Scorecard"
        back={{ to: "/", label: "Home" }}
        right={
          <button
            type="button"
            className={`${styles.finishChip} bt-press`}
            onClick={handleFinish}
          >
            Finish
          </button>
        }
      />

      <section className={styles.content}>
        <div className={styles.scroller}>
          <div
            className={`${styles.grid} ${styles.namesRow}`}
            style={gridStyle}
          >
            <span className={styles.namesLabel}>Hole</span>
            {round.players.map((player, i) => (
              <span key={i} className={styles.playerName} title={player.name}>
                {player.name}
              </span>
            ))}
          </div>

          <div className={styles.rows}>
            {holes.map((hole, holeIndex) => {
              const scored = isHoleScored(round, holeIndex);
              const upNext = holeIndex === nextHole;
              return (
                <Link
                  key={holeIndex}
                  to={`/hole/${holeIndex}`}
                  className={`${styles.grid} ${styles.holeRow} bt-press`}
                  style={gridStyle}
                  data-up-next={upNext}
                  aria-label={`${hole.name}, par ${hole.par}, ${
                    scored ? "scored" : "not yet scored"
                  } — edit scores`}
                >
                  <span className={styles.holeCell}>
                    <span className={styles.holeName}>
                      <span className={styles.holeNumber}>{holeIndex + 1}</span>
                      {hole.name}
                    </span>
                    <span className={styles.holePar} data-up-next={upNext}>
                      {upNext ? `Up next · Par ${hole.par}` : `Par ${hole.par}`}
                    </span>
                  </span>
                  {round.players.map((player, playerIndex) => {
                    const score = player.scores[holeIndex];
                    return (
                      <span key={playerIndex} className={styles.scoreCell}>
                        <span
                          className={styles.score}
                          data-ace={score === 1}
                          data-blank={score === null}
                          data-picked-up={score === MAX_SCORE}
                          aria-label={
                            score === null ? "not yet entered" : undefined
                          }
                        >
                          {score ?? "·"}
                        </span>
                      </span>
                    );
                  })}
                </Link>
              );
            })}
          </div>

          <div
            className={`${styles.grid} ${styles.totalsRow}`}
            style={gridStyle}
          >
            <span className={styles.totalsLabel}>Total</span>
            {totals.map((total, i) => (
              <span
                key={i}
                className={styles.total}
                data-leader={anyScores && total === lowest}
                aria-label={`${round.players[i].name} total: ${total}`}
              >
                {total}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.footer}>
        {nextHole !== null ? (
          <ButtonLink to={`/hole/${nextHole}`} big>
            Score Hole {nextHole + 1} ›
          </ButtonLink>
        ) : (
          <Button big onClick={handleFinish}>
            Finish Round
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmFinish}
        title="Finish early?"
        body={`${blank} hole${blank === 1 ? " is" : "s are"} still blank — an incomplete round has no winner.`}
        confirmLabel="Finish anyway"
        onConfirm={() => {
          setConfirmFinish(false);
          navigate("/results");
        }}
        onCancel={() => setConfirmFinish(false)}
      />
    </Shell>
  );
}
