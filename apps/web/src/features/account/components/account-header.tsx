import type { FinanzasAccountTabViewModel } from "@finanzas/ui";

import { StatusPill } from "../../../ui/components/index.js";
import { getSyncStatusLabel, getSyncTone } from "../../shared/lib/formatters.js";
import styles from "./account-header.module.css";

/**
 * Header block for Account screen.
 */
export interface AccountHeaderProps {
  sync: FinanzasAccountTabViewModel["sync"];
}

export const AccountHeader = ({ sync }: AccountHeaderProps): JSX.Element => (
  <header className={styles.header}>
    <div className={styles.titleGroup}>
      <p className={styles.kicker}>Control Center</p>
      <h1 className={styles.title}>Cuenta</h1>
      <p className={styles.subtitle}>
        Configuración local, salud de sincronización y estado del catálogo.
      </p>
      <p className={styles.period}>
        Cursor actual: {sync.cursor ?? "sin cursor"} · Pendientes: {sync.pendingOps}
      </p>
    </div>

    <StatusPill
      label={getSyncStatusLabel(sync.status)}
      tone={getSyncTone(sync.status)}
      className={styles.syncBadge ?? ""}
    />
  </header>
);
