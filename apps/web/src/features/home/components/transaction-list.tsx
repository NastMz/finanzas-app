import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { formatDateIso, formatTransactionAmount } from "../lib/formatters.js";
import styles from "./transaction-list.module.css";

/**
 * List of recent transactions for Home.
 */
export interface TransactionListProps {
  transactions: FinanzasHomeTabViewModel["recentTransactions"];
}

const resolveNote = (note: string | null): string =>
  note === null || note.trim().length === 0 ? "Sin nota" : note;

export const TransactionList = ({
  transactions,
}: TransactionListProps): JSX.Element => {
  if (transactions.length === 0) {
    return <p className={styles.empty}>Sin movimientos en el periodo.</p>;
  }

  return (
    <ul className={styles.list}>
      {transactions.map((transaction) => (
        <li key={transaction.id} className={styles.item}>
          <div className={styles.mainRow}>
            <p className={styles.category}>{transaction.categoryName}</p>
            <p
              className={`${styles.amount} ${transaction.kind === "expense" ? styles.expense : styles.income}`}
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
