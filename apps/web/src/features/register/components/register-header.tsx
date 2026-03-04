import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import styles from "./register-header.module.css";

/**
 * Header block for Register screen.
 */
export interface RegisterHeaderProps {
  account: FinanzasRegisterTabViewModel["account"];
  defaultDate: Date;
}

const formatDateLabel = (value: Date): string =>
  value.toISOString().slice(0, 16).replace("T", " ");

export const RegisterHeader = ({
  account,
  defaultDate,
}: RegisterHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Quick Entry</p>
      <h1 className={styles.title}>Registrar</h1>
      <p className={styles.subtitle}>
        Cuenta activa: {account.name} ({account.currency})
      </p>
      <p className={styles.period}>Fecha por defecto: {formatDateLabel(defaultDate)}</p>
    </div>
  </header>
);
