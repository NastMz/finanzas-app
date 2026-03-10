import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { formatMinorAmount } from "../../shared/lib/formatters.js";
import styles from "./summary-card.module.css";

/**
 * Summary totals card.
 */
export interface SummaryCardProps {
  currency: string;
  totals: FinanzasHomeTabViewModel["totals"];
}

const getAbsoluteMinor = (amountMinor: bigint): bigint =>
  amountMinor < 0n ? -amountMinor : amountMinor;

const getNetAmountClassName = (netMinor: bigint): string =>
  netMinor < 0n ? (styles.netNegative ?? "") : (styles.netPositive ?? "");

export const SummaryCard = ({
  currency,
  totals,
}: SummaryCardProps): JSX.Element => {
  const rows = [
    {
      label: "Ingresos",
      value: `+${formatMinorAmount(getAbsoluteMinor(totals.incomeMinor), currency)}`,
      helper: "Entradas registradas en el periodo.",
      tone: styles.income,
    },
    {
      label: "Gastos",
      value: `-${formatMinorAmount(getAbsoluteMinor(totals.expenseMinor), currency)}`,
      helper: "Salidas capturadas hasta hoy.",
      tone: styles.expense,
    },
    {
      label: "Balance",
      value: formatMinorAmount(totals.netMinor, currency),
      helper: "Resultado neto disponible para decidir.",
      tone: getNetAmountClassName(totals.netMinor),
    },
  ];

  return (
    <section
      className={styles.card}
      aria-label="Indicadores clave de ingresos, gastos y balance"
    >
      <div className={styles.header}>
        <p className={styles.kicker}>Cashflow</p>
        <h2 className={styles.title}>Resumen del periodo</h2>
        <p className={styles.subtitle}>Lo esencial, sin ruido visual.</p>
      </div>

      <div className={styles.rows}>
        {rows.map((row) => (
          <article key={row.label} className={styles.row}>
            <div className={styles.copyBlock}>
              <p className={styles.label}>{row.label}</p>
              <p className={styles.helper}>{row.helper}</p>
            </div>
            <strong className={`${styles.value} ${row.tone}`}>{row.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
};
