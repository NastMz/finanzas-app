import type { Transaction } from "@finanzas/domain";

import type {
  FinanzasTransactionItemViewModel,
  FinanzasTransactionKind,
} from "../../../models/finanzas-ui-types.js";
import { FinanzasUiError } from "../contracts/index.js";

export const toTransactionItemViewModel = (
  transaction: Transaction,
  categoryNameById: Map<string, string>,
): FinanzasTransactionItemViewModel => {
  const signedAmountMinor = transaction.amount.amountMinor;
  const kind: FinanzasTransactionKind =
    signedAmountMinor < 0n ? "expense" : "income";

  return {
    id: transaction.id,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    categoryName: categoryNameById.get(transaction.categoryId) ?? "Sin categoria",
    currency: transaction.amount.currency,
    kind,
    signedAmountMinor,
    amountMinor: signedAmountMinor < 0n ? -signedAmountMinor : signedAmountMinor,
    date: new Date(transaction.date),
    note: transaction.note,
    tags: [...transaction.tags],
    deleted: transaction.deletedAt !== null,
  };
};

export const getTotalsFromTransactionItems = (
  items: FinanzasTransactionItemViewModel[],
): { incomeMinor: bigint; expenseMinor: bigint } => {
  let incomeMinor = 0n;
  let expenseMinor = 0n;

  for (const item of items) {
    if (item.kind === "income") {
      incomeMinor += item.amountMinor;
      continue;
    }

    expenseMinor += item.amountMinor;
  }

  return {
    incomeMinor,
    expenseMinor,
  };
};

export const normalizeSignedAmount = (
  amountMinor: number | bigint,
  kind: FinanzasTransactionKind,
): bigint => {
  const value = typeof amountMinor === "bigint" ? amountMinor : BigInt(amountMinor);
  const absoluteAmount = value < 0n ? -value : value;

  if (absoluteAmount === 0n) {
    throw new FinanzasUiError("Transaction amount cannot be zero.");
  }

  return kind === "expense" ? -absoluteAmount : absoluteAmount;
};

export const dedupeStrings = (items: string[]): string[] => [...new Set(items)];
