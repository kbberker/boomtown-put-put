import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { saveSharedHoles, type Hole } from "./holesConfig";
import { useHoles } from "./useHoles";
import { Shell } from "../ui/Shell";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Button } from "../ui/Button";
import styles from "./HoleSetup.module.css";

// The editor PIN is remembered for the editing tab only (sessionStorage, never
// localStorage) so repeated edits in one sitting don't re-prompt (ADR-0003).
const PIN_SESSION_KEY = "putt-putt:pin";

// Editable form rows keep `par` as a string so the field can be cleared and
// retyped freely; we convert to a number only when saving.
type HoleDraft = {
  name: string;
  par: string;
};

function toDraft(hole: Hole): HoleDraft {
  return { name: hole.name, par: String(hole.par) };
}

function parsePar(par: string): number {
  return parseInt(par, 10);
}

function isValid(draft: HoleDraft): boolean {
  const par = parsePar(draft.par);
  return draft.name.trim() !== "" && !Number.isNaN(par) && par >= 1;
}

/**
 * Edits the fixed 9-hole course configuration. Edits are held as local drafts
 * and pushed to the shared store on Done (ADR-0003), gated by an editor PIN that
 * is checked server-side. Done requires every hole to have a name and a par of
 * at least 1; a wrong PIN or a failed write surfaces an error and changes
 * nothing. The PIN is remembered in sessionStorage for the editing tab.
 */
export function HoleSetup() {
  const navigate = useNavigate();
  // Cache-first read of the shared course (ADR-0003): paints from the local
  // cache instantly, then re-renders with the server course once it resolves so
  // edits made on another device show up here on load/refresh.
  const holes = useHoles();
  const [drafts, setDrafts] = useState<HoleDraft[]>(() => holes.map(toDraft));
  // The shared course the form was last seeded from, so an unchanged refresh is
  // a no-op and only a genuinely different server course re-seeds the drafts.
  const seeded = useRef(JSON.stringify(holes));
  // Once the user edits a field we stop re-seeding, so a refresh that lands
  // mid-edit can't clobber in-progress changes. (A refresh resolving in the same
  // tick a user first types is a known, accepted narrow race.)
  const dirty = useRef(false);
  const [pin, setPin] = useState(
    () => sessionStorage.getItem(PIN_SESSION_KEY) ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = JSON.stringify(holes);
    if (next === seeded.current) return;
    seeded.current = next;
    if (!dirty.current) setDrafts(holes.map(toDraft));
  }, [holes]);

  function updateHole(index: number, patch: Partial<HoleDraft>) {
    dirty.current = true;
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  async function handleDone() {
    if (!drafts.every(isValid)) {
      setError("Every hole needs a name and a par of at least 1.");
      return;
    }
    const holesToSave = drafts.map((d) => ({
      name: d.name.trim(),
      par: parsePar(d.par),
    }));

    setSaving(true);
    const result = await saveSharedHoles(holesToSave, pin);
    setSaving(false);

    if (!result.ok) {
      setError(
        result.reason === "unauthorized"
          ? "That PIN was not accepted."
          : "Could not save the shared course. Check your connection and try again.",
      );
      return;
    }
    sessionStorage.setItem(PIN_SESSION_KEY, pin);
    navigate("/");
  }

  return (
    <Shell>
      <ScreenHeader
        kicker="The Course"
        title="Hole Setup"
        back={{ label: "Home", to: "/" }}
      />

      <section className={styles.content}>
        {error && <p role="alert">{error}</p>}

        <fieldset className={styles.holes}>
          <legend className={styles.legend}>Holes</legend>
          {drafts.map((draft, index) => (
            <div key={index} className={styles.holeCard}>
              <label className={styles.nameField}>
                Hole name
                <input
                  type="text"
                  required
                  aria-invalid={draft.name.trim() === ""}
                  value={draft.name}
                  onChange={(e) => updateHole(index, { name: e.target.value })}
                />
              </label>
              <label className={styles.parField}>
                Par
                <input
                  type="number"
                  required
                  min={1}
                  max={9}
                  aria-invalid={!(parsePar(draft.par) >= 1)}
                  value={draft.par}
                  onChange={(e) => updateHole(index, { par: e.target.value })}
                />
              </label>
            </div>
          ))}
        </fieldset>

        <label className={styles.pinField}>
          Editor PIN
          <input
            type="password"
            required
            autoComplete="off"
            aria-invalid={pin === ""}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </label>
      </section>

      <div className={styles.footer}>
        <Button big onClick={handleDone} disabled={saving}>
          {saving ? "Saving…" : "Done"}
        </Button>
      </div>
    </Shell>
  );
}
