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

const getAbsoluteMinor = (amountMinor: bigint): bigint =>
  amountMinor < 0n ? -amountMinor : amountMinor;

export const MovementsTotalsCard = ({
  currency,
  totals,
  itemCount,
}: MovementsTotalsCardProps): JSX.Element => {
  const incomeMinor = getAbsoluteMinor(totals.incomeMinor);
  const expenseMinor = getAbsoluteMinor(totals.expenseMinor);
  const netMinor = incomeMinor - expenseMinor;

  const items = [
    {
      label: "Ingresos",
      value: formatMinorAmount(incomeMinor, currency),
      tone: styles.income,
    },
    {
      label: "Gastos",
      value: formatMinorAmount(expenseMinor, currency),
      tone: styles.expense,
    },
    {
      label: "Neto",
      value: formatMinorAmount(netMinor, currency),
      tone: netMinor < 0n ? styles.expense : styles.income,
    },
  ];

  return (
    <SurfaceCard title="Totales" subtitle={`${itemCount} movimientos`}>
      <div className={styles.rows}>
        {items.map((item) => (
          <article key={item.label} className={styles.row}>
            <p className={styles.label}>{item.label}</p>
            <strong className={`${styles.value} ${item.tone}`}>{item.value}</strong>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
};
