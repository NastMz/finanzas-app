import { describe, expect, it } from "vitest";

import { createInMemoryBootstrap } from "./in-memory-bootstrap.js";
import { createInMemoryBootstrapContext } from "./in-memory-bootstrap-context.js";

describe("createInMemoryBootstrapContext", () => {
  it("exposes command and query handlers over the explicit bootstrap contract", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

    expect(context.bootstrap).toBe(bootstrap);
    expect(context.commands).not.toBe(bootstrap);
    expect(context.queries).not.toBe(bootstrap);
    expect(context.commands.addAccount).toBe(bootstrap.addAccount);
    expect(context.queries.listAccounts).toBe(bootstrap.listAccounts);
    expect("listAccounts" in context.commands).toBe(false);
    expect("addAccount" in context.queries).toBe(false);

    const accountResult = await context.commands.addAccount({
      name: "Cuenta contexto",
      type: "cash",
      currency: "COP",
    });

    const accountListResult = await context.queries.listAccounts();
    expect(accountListResult.accounts.map((account) => account.id)).toContain(
      accountResult.account.id,
    );

    const categoryResult = await context.commands.addCategory({
      name: "Transporte",
      type: "expense",
    });

    const categoryListResult = await context.queries.listCategories();
    expect(categoryListResult.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);

    const budgetResult = await context.commands.addBudget({
      categoryId: categoryResult.category.id,
      period: "2026-03",
      limitAmountMinor: 250000,
      currency: "COP",
    });

    const budgetListResult = await context.queries.listBudgets();
    expect(budgetListResult.budgets.map((budget) => budget.id)).toEqual([
      budgetResult.budget.id,
    ]);

    const templateResult = await context.commands.addTransactionTemplate({
      name: "Arriendo",
      accountId: "acc-main",
      amountMinor: -900000,
      currency: "COP",
      categoryId: "home",
    });

    await context.commands.addRecurringRule({
      templateId: templateResult.template.id,
      schedule: {
        frequency: "monthly",
        interval: 1,
        dayOfMonth: 5,
      },
      startsOn: new Date("2026-03-01T00:00:00.000Z"),
    });

    const templateListResult = await context.queries.listTransactionTemplates();
    expect(templateListResult.templates.map((template) => template.id)).toEqual([
      templateResult.template.id,
    ]);

    const recurringRuleListResult = await context.queries.listRecurringRules();
    expect(recurringRuleListResult.recurringRules).toHaveLength(1);
  });

  it("exposes account summary via query facade", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -45000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "food",
    });

    const summary = await context.queries.getAccountSummary({
      accountId: "acc-main",
      from: new Date("2026-03-01T00:00:00.000Z"),
      to: new Date("2026-03-31T23:59:59.999Z"),
    });

    expect(summary.transactionCount).toBe(1);
    expect(summary.totals).toEqual({
      incomeMinor: 0n,
      expenseMinor: 45000n,
      netMinor: -45000n,
    });

    const syncStatus = await context.queries.getSyncStatus();
    expect(syncStatus.status).toBe("pending");
    expect(syncStatus.counts.pending).toBe(1);
  });

  it("exposes bulk transaction actions via command facade", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

    const first = await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -45000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "food",
    });
    const second = await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -25000,
      currency: "COP",
      date: new Date("2026-03-04T10:00:00.000Z"),
      categoryId: "transport",
    });

    await context.commands.bulkUpdateTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
      categoryId: "misc",
    });
    await context.commands.bulkDeleteTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
    });

    const transactions = await context.queries.listTransactions({
      accountId: "acc-main",
      includeDeleted: true,
    });
    expect(transactions.transactions).toHaveLength(2);
    expect(transactions.transactions.every((transaction) => transaction.deletedAt !== null)).toBe(
      true,
    );
  });

  it("exposes data export and import through context facades", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -45000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "food",
    });

    const exported = await context.queries.exportData();

    await context.commands.importData({
      bundle: exported.bundle,
    });

    const syncStatus = await context.queries.getSyncStatus();
    expect(syncStatus.status).toBe("synced");
  });
});
