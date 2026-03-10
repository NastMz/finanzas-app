import { createAccount } from "@finanzas/domain";
import {
  createAccountSyncChangeApplier,
  createBudgetSyncChangeApplier,
  createCategorySyncChangeApplier,
  createCompositeSyncChangeApplier,
  createTransactionSyncChangeApplier,
  type SyncChangeApplier,
} from "@finanzas/sync";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryBudgetRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  InMemorySyncStateRepository,
  InMemoryTransactionRepository,
} from "@finanzas/data";

/**
 * Shared in-memory context used by host bootstraps.
 */
export interface InMemoryAppContext {
  accounts: InMemoryAccountRepository;
  budgets: InMemoryBudgetRepository;
  categories: InMemoryCategoryRepository;
  transactions: InMemoryTransactionRepository;
  outbox: InMemoryOutboxRepository;
  syncState: InMemorySyncStateRepository;
  clock: FixedClock;
  changeApplier: SyncChangeApplier;
}

/**
 * Creates in-memory repositories and sync appliers for local-first host wiring.
 */
export const createInMemoryAppContext = (now = new Date()): InMemoryAppContext => {
  const accounts = new InMemoryAccountRepository([
    createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    }),
  ]);

  const budgets = new InMemoryBudgetRepository();
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
      budget: createBudgetSyncChangeApplier({
        budgets,
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
    budgets,
    categories,
    transactions,
    outbox,
    syncState,
    clock,
    changeApplier,
  };
};
