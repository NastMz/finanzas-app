import type {
  GetAccountSummaryInput,
  GetAccountSummaryResult,
  ListAccountsInput,
  ListAccountsResult,
  ListCategoriesInput,
  ListCategoriesResult,
  ListTransactionsInput,
  ListTransactionsResult,
} from "@finanzas/application";
import type { GetSyncStatusResult } from "@finanzas/sync";

/**
 * Minimal query dependencies required by the UI layer.
 */
export interface FinanzasUiQueries {
  listAccounts(input?: ListAccountsInput): Promise<ListAccountsResult>;
  listCategories(input?: ListCategoriesInput): Promise<ListCategoriesResult>;
  listTransactions(input: ListTransactionsInput): Promise<ListTransactionsResult>;
  getAccountSummary(
    input: GetAccountSummaryInput,
  ): Promise<GetAccountSummaryResult>;
  getSyncStatus(): Promise<GetSyncStatusResult>;
}
