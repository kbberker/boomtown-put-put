import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  loadRound,
  saveRound,
  setScore,
  MIN_SCORE,
  MAX_SCORE,
  type Round,
} from "./roundModel";
import { HOLE_COUNT } from "../holes/holesConfig";
import { useHoles } from "../holes/useHoles";
import { Shell } from "../ui/Shell";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Button } from "../ui/Button";
import styles from "./HoleEntry.module.css";

/**
 * The Hole Entry Page: the per-Hole screen for entering every Player's Score on
 * a single Hole. Opened from the Scorecard via /hole/:holeIndex, showing the
 * Hole's name and par as context. Each Player gets a stepper for their Score
 * (1–9; 9 means picked up), so the draft is always blank or in range. The
 * entry is held in local state and only persisted on Save, which requires
 * every Player to have a Score and then returns to the Scorecard — no
 * auto-advance. Re-opening a scored Hole pre-fills the existing Scores.
 */
export function HoleEntry() {
  const navigate = useNavigate();
  const { holeIndex: holeIndexParam } = useParams();
  const holeIndex = Number(holeIndexParam);

  const round = loadRound();
  const holes = useHoles();
  const hole = holes[holeIndex];

  // Draft Scores for this Hole, one per Player (null = not entered), seeded
  // from any existing Scores so re-opening a scored Hole shows current values.
  const [draft, setDraft] = useState<(number | null)[]>(() =>
    round ? round.players.map((p) => p.scores[holeIndex] ?? null) : [],
  );
  const [error, setError] = useState<string | null>(null);

  if (!round) {
    return (
      <Shell>
        <ScreenHeader title="Hole Entry" />
        <p className={styles.emptyState}>No active Round.</p>
      </Shell>
    );
  }

  if (!hole) {
    return (
      <Shell>
        <ScreenHeader title="Hole Entry" />
        <p className={styles.emptyState}>No such Hole.</p>
      </Shell>
    );
  }

  // round is narrowed to non-null above; capture so the Save closure keeps
  // the narrowing.
  const activeRound = round;

  function increase(playerIndex: number) {
    setDraft((current) =>
      current.map((value, i) =>
        i === playerIndex
          ? value === null
            ? MIN_SCORE
            : Math.min(value + 1, MAX_SCORE)
          : value,
      ),
    );
  }

  function decrease(playerIndex: number) {
    setDraft((current) =>
      current.map((value, i) =>
        i === playerIndex && value !== null && value > MIN_SCORE
          ? value - 1
          : value,
      ),
    );
  }

  function handleSave() {
    if (draft.some((value) => value === null)) {
      setError("Every Player needs a Score from 1 to 9.");
      return;
    }
    let updated: Round = activeRound;
    draft.forEach((value, playerIndex) => {
      updated = setScore(updated, playerIndex, holeIndex, value as number);
    });
    saveRound(updated);
    navigate("/scorecard");
  }

  const scored = draft.filter((value) => value !== null).length;

  return (
    <Shell>
      <ScreenHeader
        kicker={`Hole ${holeIndex + 1} of ${HOLE_COUNT} · Par ${hole.par}`}
        title={hole.name}
        back={{ to: "/scorecard", label: "Scorecard" }}
      />

      <section className={styles.content}>
        {error && <p role="alert">{error}</p>}

        <fieldset className={styles.scores}>
          <legend className={styles.srOnly}>Scores</legend>
          {round.players.map((player, playerIndex) => {
            const value = draft[playerIndex];
            const blank = value === null;
            const pickedUp = value === MAX_SCORE;
            return (
              <div
                key={playerIndex}
                role="group"
                aria-label={player.name}
                className={styles.playerCard}
              >
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{player.name}</div>
                  {pickedUp && <div className={styles.pickedUp}>Picked up</div>}
                </div>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={`${styles.decrease} bt-press`}
                    data-dimmed={blank || value <= MIN_SCORE}
                    aria-label={`Decrease ${player.name}'s score`}
                    onClick={() => decrease(playerIndex)}
                  >
                    −
                  </button>
                  <div
                    className={styles.value}
                    data-blank={blank}
                    data-picked-up={pickedUp}
                    aria-live="polite"
                  >
                    {value ?? "–"}
                  </div>
                  <button
                    type="button"
                    className={`${styles.increase} bt-press`}
                    data-dimmed={pickedUp}
                    aria-label={`Increase ${player.name}'s score`}
                    onClick={() => increase(playerIndex)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </fieldset>

        <p className={styles.helper}>
          {scored} of {round.players.length} scored · 9 means picked up
        </p>
      </section>

      <div className={styles.footer}>
        <Button big onClick={handleSave}>
          Save Scores
        </Button>
      </div>
    </Shell>
  );
}
