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
  type AddAccountInput,
  type AddCategoryInput,
  type AddTransactionInput,
  type DeleteAccountInput,
  type DeleteCategoryInput,
  type DeleteTransactionInput,
  type ListTransactionsInput,
  type UpdateAccountInput,
  type UpdateCategoryInput,
} from "@finanzas/application";
import { syncNow as runSyncNow } from "@finanzas/sync";

import { createInMemorySyncApi } from "./create-in-memory-sync-api.js";
import { createSequenceIdGenerator } from "./create-sequence-id-generator.js";
import { createWebContext } from "./create-web-context.js";

export interface WebBootstrap {
  addAccount(input: AddAccountInput): ReturnType<typeof addAccount>;
  updateAccount(input: UpdateAccountInput): ReturnType<typeof updateAccount>;
  deleteAccount(input: DeleteAccountInput): ReturnType<typeof deleteAccount>;
  addCategory(input: AddCategoryInput): ReturnType<typeof addCategory>;
  updateCategory(input: UpdateCategoryInput): ReturnType<typeof updateCategory>;
  deleteCategory(input: DeleteCategoryInput): ReturnType<typeof deleteCategory>;
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

export const createWebBootstrap = (): WebBootstrap => {
  const { accounts, categories, transactions, outbox, syncState, clock, changeApplier } =
    createWebContext();
  const syncApi = createInMemorySyncApi(clock);
  const ids = createSequenceIdGenerator("web-");

  return {
    addAccount: (input: AddAccountInput) =>
      addAccount(
        {
          accounts,
          outbox,
          clock,
          ids,
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
          deviceId: "web-local-device",
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
        deviceId: "web-local-device",
      }),
  };
};
