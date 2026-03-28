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
  if ((totals.byCurrency?.length ?? 0) > 1) {
    return (
      <SurfaceCard title="Totales" subtitle={`${itemCount} movimientos`}>
        <div className={styles.rows}>
          {(totals.byCurrency ?? []).map((entry) => {
            const netMinor = entry.incomeMinor - entry.expenseMinor;

            return (
              <article key={entry.currency} className={styles.row}>
                <div>
                  <p className={styles.label}>{entry.currency}</p>
                  <small className={styles.label}>Totales por moneda</small>
                </div>
                <div>
                  <strong className={`${styles.value} ${styles.income}`}>
                    {formatMinorAmount(entry.incomeMinor, entry.currency)}
                  </strong>
                  <br />
                  <strong className={`${styles.value} ${styles.expense}`}>
                    {formatMinorAmount(entry.expenseMinor, entry.currency)}
                  </strong>
                  <br />
                  <strong className={`${styles.value} ${netMinor < 0n ? styles.expense : styles.income}`}>
                    {formatMinorAmount(netMinor, entry.currency)}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      </SurfaceCard>
    );
  }

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
