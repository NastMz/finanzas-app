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

const getNetAmountClassName = (netMinor: bigint): string =>
  netMinor < 0n ? (styles.netNegative ?? "") : (styles.netPositive ?? "");

const getAbsoluteMinor = (amountMinor: bigint): bigint =>
  amountMinor < 0n ? -amountMinor : amountMinor;

export const SummaryCard = ({
  currency,
  totals,
}: SummaryCardProps): JSX.Element => (
  <section
    className={styles.grid}
    aria-label="Indicadores clave de ingresos, gastos y balance"
  >
    <article className={`${styles.statCard} ${styles.incomeCard}`}>
      <p className={styles.label}>Ingresos</p>
      <p className={`${styles.value} ${styles.income}`}>
        +{formatMinorAmount(getAbsoluteMinor(totals.incomeMinor), currency)}
      </p>
      <p className={styles.helper}>Entradas totales del periodo</p>
    </article>

    <article className={`${styles.statCard} ${styles.expenseCard}`}>
      <p className={styles.label}>Gastos</p>
      <p className={`${styles.value} ${styles.expense}`}>
        -{formatMinorAmount(getAbsoluteMinor(totals.expenseMinor), currency)}
      </p>
      <p className={styles.helper}>Salidas registradas del periodo</p>
    </article>

    <article className={`${styles.statCard} ${styles.balanceCard}`}>
      <p className={styles.label}>Balance</p>
      <p className={`${styles.value} ${getNetAmountClassName(totals.netMinor)}`}>
        {formatMinorAmount(totals.netMinor, currency)}
      </p>
      <p className={styles.helper}>Resultado neto actual</p>
    </article>
  </section>
);
