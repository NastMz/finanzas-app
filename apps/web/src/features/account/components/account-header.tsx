import type { FinanzasAccountTabViewModel } from "@finanzas/ui";

import { StatusPill } from "../../../ui/components/index.js";
import { getSyncStatusLabel, getSyncTone } from "../../shared/lib/formatters.js";
import styles from "./account-header.module.css";

/**
 * Header block for Account screen.
 */
export interface AccountHeaderProps {
  sync: FinanzasAccountTabViewModel["sync"];
  accounts: FinanzasAccountTabViewModel["accounts"];
  categories: FinanzasAccountTabViewModel["categories"];
}

export const AccountHeader = ({
  sync,
  accounts,
  categories,
}: AccountHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Vista general</p>
      <h1 className={styles.title}>Cuenta</h1>
      <p className={styles.subtitle}>
        Revisa tus cuentas, categorias y el estado de sincronizacion.
      </p>
      <p className={styles.period}>
        Ultima actualizacion registrada: {sync.cursor ?? "pendiente"} · Cambios pendientes: {sync.pendingOps}
      </p>
    </div>

    <div className={styles.sideBlock}>
      <StatusPill
        label={getSyncStatusLabel(sync.status)}
        tone={getSyncTone(sync.status)}
        className={styles.syncBadge ?? ""}
      />

      <div className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Cuentas</span>
          <strong className={styles.metricValue}>{accounts.total}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Categorias</span>
          <strong className={styles.metricValue}>{categories.total}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Fallidos</span>
          <strong className={styles.metricValue}>{sync.failedOps}</strong>
        </article>
      </div>
    </div>
  </header>
);
