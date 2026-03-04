import { classNames } from "../../lib/class-names.js";
import styles from "./status-pill.module.css";

/**
 * Supported visual variants for `StatusPill`.
 */
export type StatusPillTone = "success" | "warning" | "danger";

/**
 * Props for generic status badge.
 */
export interface StatusPillProps {
  label: string;
  tone: StatusPillTone;
  className?: string;
}

const toneClassByStatus: Record<StatusPillTone, string | undefined> = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

export const StatusPill = ({
  label,
  tone,
  className,
}: StatusPillProps): JSX.Element => (
  <span className={classNames(styles.badge, toneClassByStatus[tone], className)}>
    <span className={styles.dot} aria-hidden="true" />
    {label}
  </span>
);
