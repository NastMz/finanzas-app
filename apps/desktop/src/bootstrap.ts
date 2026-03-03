import {
  addAccount,
  addCategory,
  addTransaction,
  deleteAccount,
  deleteCategory,
  deleteTransaction,
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

import { createDesktopContext } from "./create-desktop-context.js";

export interface DesktopBootstrap {
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
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

/**
 * Optional dependency overrides for `createDesktopBootstrap`.
 */
export interface CreateDesktopBootstrapOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export const createDesktopBootstrap = (
  options: CreateDesktopBootstrapOptions = {},
): DesktopBootstrap => {
  const {
    accounts,
    categories,
    transactions,
    outbox,
    syncState,
    clock,
    changeApplier,
  } = createDesktopContext();
  const syncApi = options.syncApi ?? createInMemorySyncApiClient(clock);
  const deviceId = options.deviceId ?? "desktop-local-device";
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
    listTransactions: (input: ListTransactionsInput) =>
      listTransactions(
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
