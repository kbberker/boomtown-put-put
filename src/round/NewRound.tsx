import { useState } from "react";
import { useNavigate } from "react-router";
import {
  createRound,
  loadRound,
  saveRound,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "./roundModel";
import { Shell } from "../ui/Shell";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import styles from "./NewRound.module.css";

const INITIAL_PLAYER_COUNT = 2;

function defaultName(index: number): string {
  return `Player ${index + 1}`;
}

function initialNames(): string[] {
  return Array.from({ length: INITIAL_PLAYER_COUNT }, (_, i) => defaultName(i));
}

/**
 * The New Round flow: the Scorekeeper assembles a roster of 1–6 Players with
 * pre-filled, editable names (duplicates allowed), then tees off. Starting
 * locks the roster into a fresh Round and persists it as the active Round.
 */
export function NewRound() {
  const navigate = useNavigate();
  const [names, setNames] = useState<string[]>(initialNames);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function updateName(index: number, value: string) {
    setNames((current) => current.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    setNames((current) =>
      current.length >= MAX_PLAYERS
        ? current
        : [...current, defaultName(current.length)],
    );
  }

  function removePlayer(index: number) {
    setNames((current) =>
      current.length <= MIN_PLAYERS
        ? current
        : current.filter((_, i) => i !== index),
    );
  }

  function startRound() {
    saveRound(createRound(names));
    navigate("/scorecard");
  }

  function handleTeeOff() {
    if (!names.every((n) => n.trim() !== "")) {
      setError("Every Player needs a name.");
      return;
    }
    setError(null);
    // Only one Round is active at a time (ADR-0001). If one is in progress,
    // starting overwrites it, so confirm before discarding it.
    if (loadRound() !== null) {
      setConfirmDiscard(true);
      return;
    }
    startRound();
  }

  return (
    <Shell>
      <ScreenHeader
        kicker="Assemble the group"
        title="New Round"
        back={{ to: "/", label: "Home" }}
      />

      <section className={styles.content}>
        {error && <p role="alert">{error}</p>}

        <fieldset className={styles.players}>
          <legend className={styles.srOnly}>Players</legend>
          {names.map((name, index) => (
            <div key={index} className={styles.playerCard}>
              <span className={styles.numberTile} aria-hidden="true">
                {index + 1}
              </span>
              <input
                type="text"
                required
                aria-label={`Player ${index + 1} name`}
                aria-invalid={name.trim() === ""}
                value={name}
                onChange={(e) => updateName(index, e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
              />
              {names.length > MIN_PLAYERS && (
                <button
                  type="button"
                  className={`${styles.remove} bt-press`}
                  aria-label={`Remove Player ${index + 1}`}
                  onClick={() => removePlayer(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </fieldset>

        {names.length < MAX_PLAYERS && (
          <button
            type="button"
            className={`${styles.add} bt-press`}
            onClick={addPlayer}
          >
            + Add Player
          </button>
        )}

        <p className={styles.helper}>
          {names.length} of {MAX_PLAYERS} players · roster locks at tee-off
        </p>
      </section>

      <div className={styles.footer}>
        <Button big onClick={handleTeeOff}>
          Tee Off
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Start over?"
        body="This discards your round in progress."
        confirmLabel="Discard & start"
        danger
        onConfirm={() => {
          setConfirmDiscard(false);
          startRound();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </Shell>
  );
}
