import type { FinanzasApplicationSurface } from "@finanzas/application";
import type { FinanzasSyncSurface } from "@finanzas/sync";

export interface InMemoryBootstrap
  extends Pick<
  FinanzasApplicationSurface,
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
  Pick<FinanzasSyncSurface, "getSyncStatus" | "syncNow"> {
  importData: FinanzasApplicationSurface["importData"];
}
