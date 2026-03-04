import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { formatMinorAmount } from "../../shared/lib/formatters.js";
import styles from "./summary-card.module.css";

/**
 * Summary totals card.
 */
export interface SummaryCardProps {
  currency: string;
  totals: FinanzasHomeTabViewModel["totals"];
}

const getNetAmountClassName = (netMinor: bigint): string =>
  netMinor < 0n ? (styles.netNegative ?? "") : (styles.netPositive ?? "");

export const SummaryCard = ({
  currency,
  totals,
}: SummaryCardProps): JSX.Element => (
  <SurfaceCard title="Resumen" subtitle="Balance del periodo">
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
      <div className={`${styles.row} ${styles.netRow}`}>
        <p className={styles.label}>Balance</p>
        <p className={`${styles.value} ${getNetAmountClassName(totals.netMinor)}`}>
          {formatMinorAmount(totals.netMinor, currency)}
        </p>
      </div>
    </div>
  </SurfaceCard>
);
