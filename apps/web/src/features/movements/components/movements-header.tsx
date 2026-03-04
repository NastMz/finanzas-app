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
}

export const MovementsHeader = ({
  account,
  includeDeleted,
  sync,
}: MovementsHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Ledger</p>
      <h1 className={styles.title}>Movimientos</h1>
      <p className={styles.subtitle}>
        Cuenta: {account.name} ({account.currency})
      </p>
      <p className={styles.period}>
        {includeDeleted
          ? "Vista: activos + eliminados"
          : "Vista: solo movimientos activos"}
      </p>
    </div>

    <StatusPill
      label={getSyncStatusLabel(sync.status)}
      tone={getSyncTone(sync.status)}
      className={styles.syncBadge ?? ""}
    />
  </header>
);
