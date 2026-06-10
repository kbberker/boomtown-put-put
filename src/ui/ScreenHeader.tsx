import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./ScreenHeader.module.css";

/**
 * Green scoreboard header bar for the functional (cream) screens: tracked
 * uppercase kicker over an Anton title, with an optional back link on the
 * left and an action slot (e.g. a FINISH chip) on the right.
 */
export function ScreenHeader({
  kicker,
  title,
  back,
  right,
}: {
  kicker?: string;
  title: string;
  back?: { to: string; label: string };
  right?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      {(back || right) && (
        <div className={styles.nav}>
          {back ? (
            <Link to={back.to} className={`${styles.backLink} bt-press`}>
              ‹ {back.label}
            </Link>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      <div className={styles.heading}>
        {kicker && <p className={styles.kicker}>{kicker}</p>}
        <h1 className={styles.title}>{title}</h1>
      </div>
    </header>
  );
}
