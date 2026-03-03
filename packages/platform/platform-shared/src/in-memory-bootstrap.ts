import {
  addAccount,
  addCategory,
  addTransaction,
  deleteAccount,
  deleteCategory,
  deleteTransaction,
  getAccountSummary,
  listAccounts,
  listCategories,
  listTransactions,
  updateAccount,
  updateCategory,
  updateTransaction,
  type IdGenerator,
  type AddAccountInput,
  type AddCategoryInput,
  type AddTransactionInput,
  type DeleteAccountInput,
  type DeleteCategoryInput,
  type DeleteTransactionInput,
  type GetAccountSummaryInput,
  type ListAccountsInput,
  type ListCategoriesInput,
  type ListTransactionsInput,
  type UpdateAccountInput,
  type UpdateCategoryInput,
  type UpdateTransactionInput,
} from "@finanzas/application";
import { createUlidIdGenerator } from "@finanzas/data";
import {
  createInMemorySyncApiClient,
  syncNow as runSyncNow,
  type SyncApiClient,
} from "@finanzas/sync";

import { createInMemoryAppContext, type InMemoryAppContext } from "./in-memory-context.js";

/**
 * Shared host bootstrap contract.
 */
export interface InMemoryBootstrap {
  addAccount(input: AddAccountInput): ReturnType<typeof addAccount>;
  updateAccount(input: UpdateAccountInput): ReturnType<typeof updateAccount>;
  deleteAccount(input: DeleteAccountInput): ReturnType<typeof deleteAccount>;
  addCategory(input: AddCategoryInput): ReturnType<typeof addCategory>;
  updateCategory(input: UpdateCategoryInput): ReturnType<typeof updateCategory>;
  deleteCategory(input: DeleteCategoryInput): ReturnType<typeof deleteCategory>;
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  updateTransaction(
    input: UpdateTransactionInput,
  ): ReturnType<typeof updateTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listAccounts(input?: ListAccountsInput): ReturnType<typeof listAccounts>;
  listCategories(input?: ListCategoriesInput): ReturnType<typeof listCategories>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  getAccountSummary(
    input: GetAccountSummaryInput,
  ): ReturnType<typeof getAccountSummary>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

/**
 * Config for creating a shared in-memory host bootstrap.
 */
export interface CreateInMemoryBootstrapOptions {
  defaultDeviceId: string;
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
  context?: InMemoryAppContext;
}

/**
 * Creates a reusable in-memory bootstrap with application use cases + sync engine.
 */
export const createInMemoryBootstrap = (
  options: CreateInMemoryBootstrapOptions,
): InMemoryBootstrap => {
  const context = options.context ?? createInMemoryAppContext();
  const {
    accounts,
    categories,
    transactions,
    outbox,
    syncState,
    clock,
    changeApplier,
  } = context;
  const syncApi = options.syncApi ?? createInMemorySyncApiClient(clock);
  const deviceId = options.deviceId ?? options.defaultDeviceId;
  const ids =
    options.ids ??
    createUlidIdGenerator({
      namespace: deviceId,
    });

  return {
    addAccount: (input: AddAccountInput) =>
      addAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateAccount: (input: UpdateAccountInput) =>
      updateAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteAccount: (input: DeleteAccountInput) =>
      deleteAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addCategory: (input: AddCategoryInput) =>
      addCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateCategory: (input: UpdateCategoryInput) =>
      updateCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteCategory: (input: DeleteCategoryInput) =>
      deleteCategory(
        {
          categories,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    addTransaction: (input: AddTransactionInput) =>
      addTransaction(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    updateTransaction: (input: UpdateTransactionInput) =>
      updateTransaction(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    deleteTransaction: (input: DeleteTransactionInput) =>
      deleteTransaction(
        {
          transactions,
          outbox,
          clock,
          ids,
          deviceId,
        },
        input,
      ),
    listAccounts: (input: ListAccountsInput = {}) =>
      listAccounts(
        {
          accounts,
        },
        input,
      ),
    listCategories: (input: ListCategoriesInput = {}) =>
      listCategories(
        {
          categories,
        },
        input,
      ),
    listTransactions: (input: ListTransactionsInput) =>
      listTransactions(
        {
          accounts,
          transactions,
        },
        input,
      ),
    getAccountSummary: (input: GetAccountSummaryInput) =>
      getAccountSummary(
        {
          accounts,
          transactions,
        },
        input,
      ),
    syncNow: () =>
      runSyncNow({
        outbox,
        api: syncApi,
        syncState,
        changeApplier,
        deviceId,
      }),
  };
};
