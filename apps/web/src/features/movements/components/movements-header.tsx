import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";

import { StatusPill } from "../../../ui/components/index.js";
import { getSyncStatusLabel, getSyncTone } from "../../shared/lib/formatters.js";
import styles from "./movements-header.module.css";

/**
 * Header block for Movements screen.
 */
export interface MovementsHeaderProps {
  account: FinanzasMovementsTabViewModel["account"];
  includeDeleted: boolean;
  sync: FinanzasMovementsTabViewModel["sync"];
  itemCount: number;
  deletedCount: number;
}

export const MovementsHeader = ({
  account,
  includeDeleted,
  sync,
  itemCount,
  deletedCount,
}: MovementsHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Ledger</p>
      <h1 className={styles.title}>Movimientos</h1>
      <p className={styles.subtitle}>
        Cuenta: {account.name}{" "}({account.currency})
      </p>
      <p className={styles.period}>
        {includeDeleted
          ? "Vista: activos + eliminados"
          : "Vista: solo movimientos activos"}
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
          <span className={styles.metricLabel}>Movimientos</span>
          <strong className={styles.metricValue}>{itemCount}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Eliminados</span>
          <strong className={styles.metricValue}>{deletedCount}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Tipo de cuenta</span>
          <strong className={styles.metricValue}>{account.type}</strong>
        </article>
      </div>
    </div>
  </header>
);
