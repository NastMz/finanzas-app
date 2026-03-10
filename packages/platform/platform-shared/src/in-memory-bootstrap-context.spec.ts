import { describe, expect, it } from "vitest";

import { createInMemoryBootstrap } from "./in-memory-bootstrap.js";
import { createInMemoryBootstrapContext } from "./in-memory-bootstrap-context.js";

describe("createInMemoryBootstrapContext", () => {
  it("exposes command and query facades over the same bootstrap", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

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
});
