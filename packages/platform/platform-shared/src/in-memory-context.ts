import { createAccount } from "@finanzas/domain";
import {
  createAccountSyncChangeApplier,
  createBudgetSyncChangeApplier,
  createCategorySyncChangeApplier,
  createCompositeSyncChangeApplier,
  createRecurringRuleSyncChangeApplier,
  createTransactionSyncChangeApplier,
  createTransactionTemplateSyncChangeApplier,
  type SyncChangeApplier,
} from "@finanzas/sync";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryBudgetRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  InMemorySyncStateRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionTemplateRepository,
} from "@finanzas/data";

/**
 * Shared in-memory context used by host bootstraps.
 */
export interface InMemoryAppContext {
  accounts: InMemoryAccountRepository;
  budgets: InMemoryBudgetRepository;
  categories: InMemoryCategoryRepository;
  recurringRules: InMemoryRecurringRuleRepository;
  transactions: InMemoryTransactionRepository;
  transactionTemplates: InMemoryTransactionTemplateRepository;
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
  const recurringRules = new InMemoryRecurringRuleRepository();
  const transactions = new InMemoryTransactionRepository();
  const transactionTemplates = new InMemoryTransactionTemplateRepository();
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
      "recurring-rule": createRecurringRuleSyncChangeApplier({
        recurringRules,
      }),
      transaction: createTransactionSyncChangeApplier({
        transactions,
      }),
      "transaction-template": createTransactionTemplateSyncChangeApplier({
        templates: transactionTemplates,
      }),
    },
  });

  return {
    accounts,
    budgets,
    categories,
    recurringRules,
    transactions,
    transactionTemplates,
    outbox,
    syncState,
    clock,
    changeApplier,
  };
};
