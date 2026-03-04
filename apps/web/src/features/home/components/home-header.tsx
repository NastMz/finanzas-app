import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { StatusPill, type StatusPillTone } from "../../../ui/components/index.js";
import { getSyncStatusLabel } from "../lib/formatters.js";
import styles from "./home-header.module.css";

/**
 * Header block for Home screen.
 */
export interface HomeHeaderProps {
  account: FinanzasHomeTabViewModel["account"];
  period: FinanzasHomeTabViewModel["period"];
  sync: FinanzasHomeTabViewModel["sync"];
}

export const HomeHeader = ({
  account,
  period,
  sync,
}: HomeHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Dashboard</p>
      <h1 className={styles.title}>Inicio</h1>
      <p className={styles.subtitle}>
        Cuenta: {account.name} ({account.currency})
      </p>
      <p className={styles.period}>Periodo: {period.label}</p>
    </div>
    <StatusPill
      label={getSyncStatusLabel(sync.status)}
      tone={getSyncTone(sync.status)}
      className={styles.syncBadge ?? ""}
    />
  </header>
);

const getSyncTone = (
  status: FinanzasHomeTabViewModel["sync"]["status"],
): StatusPillTone => {
  switch (status) {
    case "synced":
      return "success";
    case "pending":
      return "warning";
    case "error":
      return "danger";
  }
};
