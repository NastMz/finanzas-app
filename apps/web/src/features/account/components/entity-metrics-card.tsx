import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./entity-metrics-card.module.css";

/**
 * Counter payload for account/category entities.
 */
export interface EntityMetrics {
  total: number;
  active: number;
  deleted: number;
}

/**
 * Generic metrics card for entity counters.
 */
export interface EntityMetricsCardProps {
  title: string;
  subtitle: string;
  metrics: EntityMetrics;
}

export const EntityMetricsCard = ({
  title,
  subtitle,
  metrics,
}: EntityMetricsCardProps): JSX.Element => (
  <SurfaceCard title={title} subtitle={subtitle}>
    <ul className={styles.list} role="list">
      <li className={styles.item}>
        <span className={styles.label}>Total</span>
        <strong className={styles.value}>{metrics.total}</strong>
      </li>
      <li className={styles.item}>
        <span className={styles.label}>Activas</span>
        <strong className={styles.value}>{metrics.active}</strong>
      </li>
      <li className={styles.item}>
        <span className={styles.label}>Eliminadas</span>
        <strong className={styles.value}>{metrics.deleted}</strong>
      </li>
    </ul>
  </SurfaceCard>
);
