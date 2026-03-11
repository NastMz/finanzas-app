import type { InMemoryBootstrap } from "./in-memory-bootstrap.js";

export type InMemoryBootstrapCommandHandlers = Pick<
InMemoryBootstrap,
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
| "runRecurringRules"
| "syncNow"
>;
