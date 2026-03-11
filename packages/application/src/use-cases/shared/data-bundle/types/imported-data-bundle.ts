import type { ImportedAccountSnapshot } from "./imported-account-snapshot.js";
import type { ImportedBudgetSnapshot } from "./imported-budget-snapshot.js";
import type { ImportedCategorySnapshot } from "./imported-category-snapshot.js";
import type { ImportedRecurringRuleSnapshot } from "./imported-recurring-rule-snapshot.js";
import type { ImportedTransactionSnapshot } from "./imported-transaction-snapshot.js";
import type { ImportedTransactionTemplateSnapshot } from "./imported-transaction-template-snapshot.js";

export interface ImportedDataBundle {
  exportedAt: Date;
  accounts: ImportedAccountSnapshot[];
  categories: ImportedCategorySnapshot[];
  budgets: ImportedBudgetSnapshot[];
  transactionTemplates: ImportedTransactionTemplateSnapshot[];
  recurringRules: ImportedRecurringRuleSnapshot[];
  transactions: ImportedTransactionSnapshot[];
}
