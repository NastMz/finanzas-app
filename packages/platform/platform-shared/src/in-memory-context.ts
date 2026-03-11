import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  Clock,
  OutboxRepository,
  RecurringRuleRepository,
  TransactionRepository,
  TransactionTemplateRepository,
} from "@finanzas/application";
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
  type SyncStateRepository,
  type SyncStatusOutboxRepository,
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
  accounts: AccountRepository;
  budgets: BudgetRepository;
  categories: CategoryRepository;
  recurringRules: RecurringRuleRepository;
  transactions: TransactionRepository;
  transactionTemplates: TransactionTemplateRepository;
  outbox: OutboxRepository & SyncStatusOutboxRepository;
  syncState: SyncStateRepository;
  clock: Clock;
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
