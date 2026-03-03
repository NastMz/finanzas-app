import { createAccount } from "@finanzas/domain";
import {
  createAccountSyncChangeApplier,
  createCategorySyncChangeApplier,
  createCompositeSyncChangeApplier,
  createTransactionSyncChangeApplier,
  type SyncChangeApplier,
} from "@finanzas/sync";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  InMemorySyncStateRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

export interface WebContext {
  accounts: InMemoryAccountRepository;
  categories: InMemoryCategoryRepository;
  transactions: InMemoryTransactionRepository;
  outbox: InMemoryOutboxRepository;
  syncState: InMemorySyncStateRepository;
  clock: FixedClock;
  changeApplier: SyncChangeApplier;
}

/**
 * Creates the in-memory repositories and sync appliers used by web bootstrap.
 */
export const createWebContext = (now = new Date()): WebContext => {
  const accounts = new InMemoryAccountRepository([
    createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    }),
  ]);

  const categories = new InMemoryCategoryRepository();
  const transactions = new InMemoryTransactionRepository();
  const outbox = new InMemoryOutboxRepository();
  const syncState = new InMemorySyncStateRepository("0");
  const clock = new FixedClock(now);

  const changeApplier = createCompositeSyncChangeApplier({
    appliersByEntityType: {
      account: createAccountSyncChangeApplier({
        accounts,
      }),
      category: createCategorySyncChangeApplier({
        categories,
      }),
      transaction: createTransactionSyncChangeApplier({
        transactions,
      }),
    },
  });

  return {
    accounts,
    categories,
    transactions,
    outbox,
    syncState,
    clock,
    changeApplier,
  };
};
