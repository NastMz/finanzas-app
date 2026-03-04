import type { FinanzasMovementsTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { formatMinorAmount } from "../../shared/lib/formatters.js";
import styles from "./movements-totals-card.module.css";

/**
 * Summary card for movement totals.
 */
export interface MovementsTotalsCardProps {
  currency: string;
  totals: FinanzasMovementsTabViewModel["totals"];
  itemCount: number;
}

export const MovementsTotalsCard = ({
  currency,
  totals,
  itemCount,
}: MovementsTotalsCardProps): JSX.Element => (
  <SurfaceCard title="Totales" subtitle={`${itemCount} movimientos`}>
    <div className={styles.rows}>
      <div className={styles.row}>
        <p className={styles.label}>Ingresos</p>
        <p className={`${styles.value} ${styles.income}`}>
          {formatMinorAmount(totals.incomeMinor, currency)}
        </p>
      </div>
      <div className={styles.row}>
        <p className={styles.label}>Gastos</p>
        <p className={`${styles.value} ${styles.expense}`}>
          {formatMinorAmount(totals.expenseMinor, currency)}
        </p>
      </div>
    </div>
  </SurfaceCard>
);
