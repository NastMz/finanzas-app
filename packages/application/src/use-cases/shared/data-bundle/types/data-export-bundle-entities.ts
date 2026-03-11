import type { ExportedAccountSnapshot } from "./exported-account-snapshot.js";
import type { ExportedBudgetSnapshot } from "./exported-budget-snapshot.js";
import type { ExportedCategorySnapshot } from "./exported-category-snapshot.js";
import type { ExportedRecurringRuleSnapshot } from "./exported-recurring-rule-snapshot.js";
import type { ExportedTransactionSnapshot } from "./exported-transaction-snapshot.js";
import type { ExportedTransactionTemplateSnapshot } from "./exported-transaction-template-snapshot.js";

export interface DataExportBundleEntities {
  accounts: ExportedAccountSnapshot[];
  categories: ExportedCategorySnapshot[];
  budgets: ExportedBudgetSnapshot[];
  transactionTemplates: ExportedTransactionTemplateSnapshot[];
  recurringRules: ExportedRecurringRuleSnapshot[];
  transactions: ExportedTransactionSnapshot[];
}
