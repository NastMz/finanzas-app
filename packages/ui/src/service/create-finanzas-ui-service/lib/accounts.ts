import type { Account, Category } from "@finanzas/domain";

import type {
  FinanzasAccountOption,
  FinanzasCategoryOption,
} from "../../../models/finanzas-ui-types.js";
import type { FinanzasUiDependencies } from "../contracts/index.js";
import { FinanzasUiError } from "../contracts/index.js";

export const resolveActiveAccount = async (
  dependencies: FinanzasUiDependencies,
  accountId: string | undefined,
): Promise<Account> => {
  const accountsResult = await dependencies.queries.listAccounts();
  const accounts = accountsResult.accounts;

  if (accounts.length === 0) {
    throw new FinanzasUiError("No active accounts available.");
  }

  if (accountId === undefined) {
    const defaultAccount = accounts[0];

    if (!defaultAccount) {
      throw new FinanzasUiError("Default account could not be resolved.");
    }

    return defaultAccount;
  }

  const selectedAccount = accounts.find((account) => account.id === accountId);

  if (!selectedAccount) {
    throw new FinanzasUiError(`Account ${accountId} is not available.`);
  }

  return selectedAccount;
};

export const buildCategoryNameById = (
  categories: Category[],
): Map<string, string> => new Map(categories.map((category) => [category.id, category.name]));

export const toAccountOption = (account: Account): FinanzasAccountOption => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  deleted: account.deletedAt !== null,
});

export const toCategoryOption = (category: Category): FinanzasCategoryOption => ({
  id: category.id,
  name: category.name,
  type: category.type,
  deleted: category.deletedAt !== null,
});
