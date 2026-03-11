import type { InMemoryBootstrap } from "./in-memory-bootstrap.js";

export type InMemoryBootstrapQueryHandlers = Pick<
InMemoryBootstrap,
| "listAccounts"
| "listBudgets"
| "listTransactionTemplates"
| "listRecurringRules"
| "listCategories"
| "listTransactions"
| "getAccountSummary"
| "exportData"
| "getSyncStatus"
>;
