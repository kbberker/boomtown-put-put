import type { ReactNode } from "react";
import styles from "./Shell.module.css";

/**
 * Responsive screen shell: a fluid cream column on felt (430px cap below
 * ~600px, growing to a 960px cap above). Functional screens sit on cream; the
 * marquee screens (Home, Results) take the felt radial gradient via `felt`.
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
