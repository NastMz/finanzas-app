import type { Account } from "@finanzas/domain";

import type { AccountRepository } from "../ports.js";

/**
 * Query parameters for listing local accounts.
 */
export interface ListAccountsInput {
  includeDeleted?: boolean;
  limit?: number;
}

/**
 * Runtime dependencies required by `listAccounts`.
 */
export interface ListAccountsDependencies {
  accounts: AccountRepository;
}

/**
 * Result payload returned by `listAccounts`.
 */
export interface ListAccountsResult {
  accounts: Account[];
}

/**
 * Lists local accounts with optional tombstone inclusion,
 * ordered by account name ascending.
 */
export const listAccounts = async (
  dependencies: ListAccountsDependencies,
  input: ListAccountsInput = {},
): Promise<ListAccountsResult> => {
  const accounts = await dependencies.accounts.listAll();
  const includeDeleted = input.includeDeleted ?? false;

  const filteredAccounts = includeDeleted
    ? accounts
    : accounts.filter((account) => account.deletedAt === null);

  const sortedAccounts = [...filteredAccounts].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  const limit = input.limit ?? null;

  return {
    accounts: limit === null ? sortedAccounts : sortedAccounts.slice(0, limit),
  };
};
