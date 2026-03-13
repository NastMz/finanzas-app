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
  selectedTransactionId?: string | null;
  transactionActions?: (
    transaction: FinanzasTransactionItemViewModel,
  ) => Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    tone?: "default" | "danger";
  }>;
}

const resolveNote = (note: string | null): string =>
  note === null || note.trim().length === 0 ? "Sin nota" : note;

const getCategoryInitials = (categoryName: string): string => {
  const tokens = categoryName.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return "TX";
  }

  if (tokens.length === 1) {
    const singleToken = tokens[0] ?? "TX";
    return singleToken.slice(0, 2).toUpperCase();
  }

  const firstToken = tokens[0] ?? "T";
  const secondToken = tokens[1] ?? "X";
  return `${firstToken.charAt(0)}${secondToken.charAt(0)}`.toUpperCase();
};

export const TransactionList = ({
  transactions,
  emptyLabel = "Sin movimientos en el periodo.",
  showDeletedState = false,
  selectedTransactionId = null,
  transactionActions,
}: TransactionListProps): JSX.Element => {
  if (transactions.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.list}>
      {transactions.map((transaction) => (
        <li
          key={transaction.id}
          className={classNames(
            styles.item,
            selectedTransactionId === transaction.id ? styles.itemSelected : undefined,
          )}
        >
          <div className={styles.leading}>
            <span className={styles.avatar} aria-hidden="true">
              {getCategoryInitials(transaction.categoryName)}
            </span>
            <div className={styles.copyBlock}>
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

              {transactionActions !== undefined
                ? (
                  <div className={styles.actionsRow}>
                    {transactionActions(transaction).map((action) => (
                      <button
                        key={`${transaction.id}-${action.label}`}
                        type="button"
                        className={classNames(
                          styles.actionButton,
                          action.tone === "danger" ? styles.actionButtonDanger : undefined,
                        )}
                        disabled={action.disabled ?? false}
                        onClick={() => {
                          action.onClick();
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                  )
                : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
