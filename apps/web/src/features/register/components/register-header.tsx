import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import styles from "./register-header.module.css";

/**
 * Header block for Register screen.
 */
export interface RegisterHeaderProps {
  account: FinanzasRegisterTabViewModel["account"];
  defaultDate: Date;
  categoryCount: number;
  suggestedCount: number;
}

const formatDateLabel = (value: Date): string =>
  value.toISOString().slice(0, 16).replace("T", " ");

export const RegisterHeader = ({
  account,
  defaultDate,
  categoryCount,
  suggestedCount,
}: RegisterHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Quick Entry</p>
      <h1 className={styles.title}>Registrar</h1>
      <p className={styles.subtitle}>
        Cuenta activa: {account.name}{" "}({account.currency})
      </p>
    </div>

    <div className={styles.metrics}>
      <article className={styles.metricCard}>
        <span className={styles.metricLabel}>Fecha por defecto</span>
        <strong className={styles.metricValue}>{formatDateLabel(defaultDate)}</strong>
      </article>
      <article className={styles.metricCard}>
        <span className={styles.metricLabel}>Categorias</span>
        <strong className={styles.metricValue}>{categoryCount}</strong>
      </article>
      <article className={styles.metricCard}>
        <span className={styles.metricLabel}>Sugerencias</span>
        <strong className={styles.metricValue}>{suggestedCount}</strong>
      </article>
    </div>
  </header>
);
