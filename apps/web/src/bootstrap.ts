import {
  addTransaction,
  deleteTransaction,
  listTransactions,
  type AddTransactionInput,
  type DeleteTransactionInput,
  type ListTransactionsInput,
} from "@finanzas/application";
import { createAccount } from "@finanzas/domain";
import { syncNow as runSyncNow, type SyncApiClient, type SyncChange } from "@finanzas/sync";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  InMemorySyncStateRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

export interface WebBootstrap {
  addTransaction(input: AddTransactionInput): ReturnType<typeof addTransaction>;
  deleteTransaction(
    input: DeleteTransactionInput,
  ): ReturnType<typeof deleteTransaction>;
  listTransactions(input: ListTransactionsInput): ReturnType<typeof listTransactions>;
  syncNow(): ReturnType<typeof runSyncNow>;
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
  const syncState = new InMemorySyncStateRepository("0");
  const clock = new FixedClock(now);
  const remoteChanges: SyncChange[] = [];

  const syncApi: SyncApiClient = {
    async push(request) {
      for (const operation of request.ops) {
        const nextVersion = remoteChanges.length + 1;

        remoteChanges.push({
          changeId: `chg-${nextVersion}`,
          entityType: operation.entityType,
          entityId: operation.entityId,
          opType: operation.opType,
          payload: { ...operation.payload },
          serverVersion:
            operation.baseVersion === undefined
              ? nextVersion
              : operation.baseVersion,
          serverTimestamp: clock.now(),
        });
      }

      return {
        ackedOpIds: request.ops.map((operation) => operation.opId),
        conflicts: [],
        serverTime: clock.now(),
      };
    },
    async pull(request) {
      const cursor = parseCursor(request.cursor);
      const changes = remoteChanges
        .slice(cursor)
        .map((change) => cloneSyncChange(change));

      return {
        nextCursor: remoteChanges.length.toString(),
        changes,
      };
    },
  };

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
    syncNow: () =>
      runSyncNow({
        outbox,
        api: syncApi,
        syncState,
        changeApplier: {
          async apply(_changes) {},
        },
        deviceId: "web-local-device",
      }),
  };
};

const parseCursor = (cursor: string | null): number => {
  if (!cursor) {
    return 0;
  }

  const parsedCursor = Number.parseInt(cursor, 10);

  if (Number.isNaN(parsedCursor) || parsedCursor < 0) {
    return 0;
  }

  return parsedCursor;
};

const cloneSyncChange = (change: SyncChange): SyncChange => ({
  ...change,
  payload: {
    ...change.payload,
  },
  serverTimestamp: new Date(change.serverTimestamp),
});
