import {
  addTransaction,
  deleteTransaction,
  listTransactions,
  type AddTransactionInput,
  type DeleteTransactionInput,
  type ListTransactionsInput,
} from "@finanzas/application";
import { syncNow as runSyncNow } from "@finanzas/sync";

import { createInMemorySyncApi } from "./create-in-memory-sync-api.js";
import { createSequenceIdGenerator } from "./create-sequence-id-generator.js";
import { createWebContext } from "./create-web-context.js";

export interface WebBootstrap {
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  syncNow(): ReturnType<typeof runSyncNow>;
}

export const createWebBootstrap = (): WebBootstrap => {
  const { accounts, transactions, outbox, syncState, clock, changeApplier } =
    createWebContext();
  const syncApi = createInMemorySyncApi(clock);
  const ids = createSequenceIdGenerator("web-");

  return {
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
