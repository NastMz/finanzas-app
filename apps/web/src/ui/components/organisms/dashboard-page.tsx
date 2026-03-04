import type { ReactNode } from "react";

import { classNames } from "../../lib/class-names.js";
import styles from "./dashboard-page.module.css";

/**
 * Shared full-page dashboard layout container.
 */
export interface DashboardPageProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export const DashboardPage = ({
  children,
  className,
  containerClassName,
}: DashboardPageProps): JSX.Element => (
  <main className={classNames(styles.page, className)}>
    <div className={classNames(styles.container, containerClassName)}>
      {children}
    </div>
  </main>
);
