import type { FinanzasTransactionItemViewModel } from "@finanzas/ui";

import { classNames } from "../../../ui/lib/class-names.js";
import { formatDateIso, formatTransactionAmount } from "../lib/formatters.js";
import styles from "./transaction-list.module.css";

/**
 * Shared transaction list used across dashboard tabs.
 */
export interface TransactionListProps {
  transactions: FinanzasTransactionItemViewModel[];
  emptyLabel?: string;
  showDeletedState?: boolean;
}

const resolveNote = (note: string | null): string =>
  note === null || note.trim().length === 0 ? "Sin nota" : note;

export const TransactionList = ({
  transactions,
  emptyLabel = "Sin movimientos en el periodo.",
  showDeletedState = false,
}: TransactionListProps): JSX.Element => {
  if (transactions.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.list}>
      {transactions.map((transaction) => (
        <li key={transaction.id} className={styles.item}>
          <div className={styles.mainRow}>
            <div className={styles.categoryBlock}>
              <p className={styles.category}>{transaction.categoryName}</p>
              {showDeletedState && transaction.deleted
                ? <span className={styles.deletedLabel}>Eliminado</span>
                : null}
            </div>

            <p
              className={classNames(
                styles.amount,
                transaction.kind === "expense" ? styles.expense : styles.income,
              )}
            >
              {formatTransactionAmount(transaction)}
            </p>
          </div>

          <div className={styles.metaRow}>
            <small>{formatDateIso(transaction.date)}</small>
            <small className={styles.note}>{resolveNote(transaction.note)}</small>
          </div>
        </li>
      ))}
    </ul>
  );
};
