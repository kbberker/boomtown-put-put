import type { ReactNode } from "react";
import styles from "./Shell.module.css";

/**
 * Phone-width screen shell. Functional screens sit on cream; the marquee
 * screens (Home, Results) take the felt radial gradient via `felt`.
 */
export function Shell({
  felt = false,
  children,
}: {
  felt?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={felt ? `${styles.shell} ${styles.felt}` : styles.shell}>
      {children}
    </div>
  );
}
