import {
  addTransaction,
  deleteTransaction,
  listTransactions,
  type AddTransactionInput,
  type DeleteTransactionInput,
  type ListTransactionsInput,
} from "@finanzas/application";
import { createAccount } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

export interface WebBootstrap {
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
}

export const createWebBootstrap = (): WebBootstrap => {
  const now = new Date();
  const accounts = new InMemoryAccountRepository([
    createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    }),
  ]);

  const transactions = new InMemoryTransactionRepository();
  const outbox = new InMemoryOutboxRepository();
  const clock = new FixedClock(now);

  let sequence = 1;

  return {
    addTransaction: (input: AddTransactionInput) =>
      addTransaction(
        {
          accounts,
          transactions,
          outbox,
          clock,
          ids: {
            nextId: () => {
              const id = `web-${sequence}`;
              sequence += 1;
              return id;
            },
          },
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
          ids: {
            nextId: () => {
              const id = `web-${sequence}`;
              sequence += 1;
              return id;
            },
          },
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
  };
};
