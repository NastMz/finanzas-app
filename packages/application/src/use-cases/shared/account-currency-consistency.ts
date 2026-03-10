import type { Account, Transaction, TransactionTemplate } from "@finanzas/domain";

import { ApplicationError } from "../../errors.js";

/**
 * Fails when any transaction currency no longer matches the owning account currency.
 */
export const assertTransactionsMatchAccountCurrency = (
  account: Account,
  transactions: Transaction[],
): void => {
  const invalidTransaction = transactions.find(
    (transaction) => transaction.amount.currency !== account.currency,
  );

  if (invalidTransaction) {
    throw new ApplicationError(
      `Transaction ${invalidTransaction.id} currency ${invalidTransaction.amount.currency} does not match account ${account.id} currency ${account.currency}.`,
    );
  }
};

/**
 * Fails when any transaction template currency no longer matches the owning account currency.
 */
export const assertTransactionTemplatesMatchAccountCurrency = (
  account: Account,
  templates: TransactionTemplate[],
): void => {
  const invalidTemplate = templates.find(
    (template) => template.amount.currency !== account.currency,
  );

  if (invalidTemplate) {
    throw new ApplicationError(
      `Transaction template ${invalidTemplate.id} currency ${invalidTemplate.amount.currency} does not match account ${account.id} currency ${account.currency}.`,
    );
  }
};
