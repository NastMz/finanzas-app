import type { FinanzasApplicationService } from "@finanzas/application";
import type { FinanzasSyncService } from "@finanzas/sync";

export interface InMemoryBootstrap
  extends Pick<
  FinanzasApplicationService,
  | "addAccount"
  | "updateAccount"
  | "deleteAccount"
  | "addBudget"
  | "updateBudget"
  | "deleteBudget"
  | "addTransactionTemplate"
  | "updateTransactionTemplate"
  | "deleteTransactionTemplate"
  | "addRecurringRule"
  | "updateRecurringRule"
  | "deleteRecurringRule"
  | "addCategory"
  | "updateCategory"
  | "deleteCategory"
  | "addTransaction"
  | "bulkUpdateTransactions"
  | "bulkDeleteTransactions"
  | "updateTransaction"
  | "deleteTransaction"
  | "importData"
  | "listAccounts"
  | "listBudgets"
  | "listTransactionTemplates"
  | "listRecurringRules"
  | "listCategories"
  | "listTransactions"
  | "getAccountSummary"
  | "exportData"
  | "runRecurringRules"
  >,
  Pick<FinanzasSyncService, "getSyncStatus" | "syncNow"> {}
