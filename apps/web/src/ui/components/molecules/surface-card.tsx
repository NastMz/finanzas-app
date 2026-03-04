import type { ReactNode } from "react";

import { classNames } from "../../lib/class-names.js";
import styles from "./surface-card.module.css";

/**
 * Generic card shell for dashboard sections.
 */
export interface SurfaceCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export const SurfaceCard = ({
  title,
  subtitle,
  className,
  contentClassName,
  children,
}: SurfaceCardProps): JSX.Element => (
  <article className={classNames(styles.card, className)}>
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle !== undefined ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
    <div className={classNames(styles.content, contentClassName)}>{children}</div>
  </article>
);
