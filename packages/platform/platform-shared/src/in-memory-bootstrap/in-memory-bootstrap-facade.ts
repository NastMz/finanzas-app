import { FinanzasApplicationService } from "@finanzas/application";
import { FinanzasSyncService } from "@finanzas/sync";

import type { InMemoryBootstrapRuntime } from "./runtime.js";
import type { InMemoryBootstrap } from "./types.js";

export class InMemoryBootstrapFacade implements InMemoryBootstrap {
  private readonly application: FinanzasApplicationService;

  private readonly sync: FinanzasSyncService;

  public constructor(private readonly runtime: InMemoryBootstrapRuntime) {
    this.application = new FinanzasApplicationService({
      accounts: runtime.accounts,
      budgets: runtime.budgets,
      categories: runtime.categories,
      recurringRules: runtime.recurringRules,
      transactions: runtime.transactions,
      transactionTemplates: runtime.transactionTemplates,
      outbox: runtime.outbox,
      clock: runtime.clock,
      ids: runtime.ids,
      deviceId: runtime.deviceId,
    });
    this.sync = new FinanzasSyncService({
      outbox: runtime.outbox,
      api: runtime.syncApi,
      syncState: runtime.syncState,
      changeApplier: runtime.changeApplier,
      deviceId: runtime.deviceId,
    });
  }

  public readonly addAccount: InMemoryBootstrap["addAccount"] = (input) =>
    this.application.addAccount(input);

  public readonly updateAccount: InMemoryBootstrap["updateAccount"] = (input) =>
    this.application.updateAccount(input);

  public readonly deleteAccount: InMemoryBootstrap["deleteAccount"] = (input) =>
    this.application.deleteAccount(input);

  public readonly addBudget: InMemoryBootstrap["addBudget"] = (input) =>
    this.application.addBudget(input);

  public readonly updateBudget: InMemoryBootstrap["updateBudget"] = (input) =>
    this.application.updateBudget(input);

  public readonly deleteBudget: InMemoryBootstrap["deleteBudget"] = (input) =>
    this.application.deleteBudget(input);

  public readonly addTransactionTemplate: InMemoryBootstrap["addTransactionTemplate"] = (
    input,
  ) => this.application.addTransactionTemplate(input);

  public readonly updateTransactionTemplate: InMemoryBootstrap["updateTransactionTemplate"] = (
    input,
  ) => this.application.updateTransactionTemplate(input);

  public readonly deleteTransactionTemplate: InMemoryBootstrap["deleteTransactionTemplate"] = (
    input,
  ) => this.application.deleteTransactionTemplate(input);

  public readonly addRecurringRule: InMemoryBootstrap["addRecurringRule"] = (input) =>
    this.application.addRecurringRule(input);

  public readonly updateRecurringRule: InMemoryBootstrap["updateRecurringRule"] = (
    input,
  ) => this.application.updateRecurringRule(input);

  public readonly deleteRecurringRule: InMemoryBootstrap["deleteRecurringRule"] = (
    input,
  ) => this.application.deleteRecurringRule(input);

  public readonly addCategory: InMemoryBootstrap["addCategory"] = (input) =>
    this.application.addCategory(input);

  public readonly updateCategory: InMemoryBootstrap["updateCategory"] = (input) =>
    this.application.updateCategory(input);

  public readonly deleteCategory: InMemoryBootstrap["deleteCategory"] = (input) =>
    this.application.deleteCategory(input);

  public readonly addTransaction: InMemoryBootstrap["addTransaction"] = (input) =>
    this.application.addTransaction(input);

  public readonly bulkUpdateTransactions: InMemoryBootstrap["bulkUpdateTransactions"] = (
    input,
  ) => this.application.bulkUpdateTransactions(input);

  public readonly bulkDeleteTransactions: InMemoryBootstrap["bulkDeleteTransactions"] = (
    input,
  ) => this.application.bulkDeleteTransactions(input);

  public readonly updateTransaction: InMemoryBootstrap["updateTransaction"] = (
    input,
  ) => this.application.updateTransaction(input);

  public readonly deleteTransaction: InMemoryBootstrap["deleteTransaction"] = (
    input,
  ) => this.application.deleteTransaction(input);

  public readonly importData: InMemoryBootstrap["importData"] = async (input) => {
    const result = await this.application.importData(input);

    await this.sync.resetState();

    return result;
  };

  public readonly listAccounts: InMemoryBootstrap["listAccounts"] = (input = {}) =>
    this.application.listAccounts(input);

  public readonly listBudgets: InMemoryBootstrap["listBudgets"] = (input = {}) =>
    this.application.listBudgets(input);

  public readonly listTransactionTemplates: InMemoryBootstrap["listTransactionTemplates"] = (
    input = {},
  ) => this.application.listTransactionTemplates(input);

  public readonly listRecurringRules: InMemoryBootstrap["listRecurringRules"] = (
    input = {},
  ) => this.application.listRecurringRules(input);

  public readonly listCategories: InMemoryBootstrap["listCategories"] = (input = {}) =>
    this.application.listCategories(input);

  public readonly listTransactions: InMemoryBootstrap["listTransactions"] = (input) =>
    this.application.listTransactions(input);

  public readonly getAccountSummary: InMemoryBootstrap["getAccountSummary"] = (
    input,
  ) => this.application.getAccountSummary(input);

  public readonly exportData: InMemoryBootstrap["exportData"] = () =>
    this.application.exportData();

  public readonly runRecurringRules: InMemoryBootstrap["runRecurringRules"] = (
    input = {},
  ) => this.application.runRecurringRules(input);

  public readonly getSyncStatus: InMemoryBootstrap["getSyncStatus"] = () =>
    this.sync.getSyncStatus();

  public readonly syncNow: InMemoryBootstrap["syncNow"] = () =>
    this.sync.syncNow();
}
