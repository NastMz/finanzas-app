import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { StatusPill } from "../../../ui/components/index.js";
import {
  formatMinorAmount,
  getSyncStatusLabel,
  getSyncTone,
} from "../../shared/lib/formatters.js";
import styles from "./home-header.module.css";

/**
 * Header block for Home screen.
 */
export interface HomeHeaderProps {
  account: FinanzasHomeTabViewModel["account"];
  period: FinanzasHomeTabViewModel["period"];
  totals: FinanzasHomeTabViewModel["totals"];
  sync: FinanzasHomeTabViewModel["sync"];
}

export const HomeHeader = ({
  account,
  period,
  totals,
  sync,
}: HomeHeaderProps): JSX.Element => (
  <header className={styles.hero}>
    <div className={styles.headerRow}>
      <div className={styles.titleGroup}>
        <p className={styles.kicker}>Dashboard</p>
        <h1 className={styles.title}>Inicio</h1>
        <p className={styles.subtitle}>
          Cuenta: {account.name} ({account.currency})
        </p>
      </div>
      <StatusPill
        label={getSyncStatusLabel(sync.status)}
        tone={getSyncTone(sync.status)}
        className={styles.syncBadge ?? ""}
      />
    </div>

    <div className={styles.balanceBlock}>
      <p className={styles.balanceLabel}>Balance disponible</p>
      <p className={styles.balanceValue}>
        {formatMinorAmount(totals.netMinor, account.currency)}
      </p>
    </div>

    <div className={styles.metaRow}>
      <p className={styles.period}>Periodo: {period.label}</p>
      <p className={styles.metaHint}>
        {sync.pendingOps} cambios pendientes de sincronizar
      </p>
    </div>
  </header>
);
