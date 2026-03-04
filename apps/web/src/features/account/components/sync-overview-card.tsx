import type { FinanzasAccountTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { getSyncStatusLabel } from "../../shared/lib/formatters.js";
import styles from "./sync-overview-card.module.css";

/**
 * Card with synchronization state counters.
 */
export interface SyncOverviewCardProps {
  sync: FinanzasAccountTabViewModel["sync"];
}

export const SyncOverviewCard = ({ sync }: SyncOverviewCardProps): JSX.Element => (
  <SurfaceCard title="Sincronización" subtitle="Estado de outbox y cursor">
    <div className={styles.metrics}>
      <div className={styles.metric}>
        <span className={styles.label}>Estado</span>
        <strong className={styles.value}>{getSyncStatusLabel(sync.status)}</strong>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Pendientes</span>
        <strong className={styles.value}>{sync.pendingOps}</strong>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Enviados</span>
        <strong className={styles.value}>{sync.sentOps}</strong>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Confirmados</span>
        <strong className={styles.value}>{sync.ackedOps}</strong>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Fallidos</span>
        <strong className={styles.value}>{sync.failedOps}</strong>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Cursor</span>
        <strong className={styles.value}>{sync.cursor ?? "sin cursor"}</strong>
      </div>
    </div>

    <div className={styles.errorPanel}>
      <span className={styles.errorLabel}>Último error</span>
      <p className={styles.errorText}>{sync.lastError ?? "Sin errores recientes."}</p>
    </div>
  </SurfaceCard>
);
