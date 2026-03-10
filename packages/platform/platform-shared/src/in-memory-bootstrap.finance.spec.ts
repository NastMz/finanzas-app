import { describe, expect, it } from "vitest";

import {
  createBootstrap,
  createTransactionInputFixture,
} from "./in-memory-bootstrap.test-helpers.js";

describe("createInMemoryBootstrap", () => {
  it("manages budget lifecycle through shared bootstrap wiring", async () => {
    const app = createBootstrap();
    const categoryResult = await app.addCategory({
      name: "Comida",
      type: "expense",
    });

    const created = await app.addBudget({
      categoryId: categoryResult.category.id,
      period: "2026-03",
      limitAmountMinor: 400000,
      currency: "COP",
    });

    const updated = await app.updateBudget({
      budgetId: created.budget.id,
      limitAmountMinor: 450000,
    });

    const activeBudgets = await app.listBudgets({
      period: "2026-03",
    });
    expect(activeBudgets.budgets.map((budget) => budget.id)).toEqual([
      created.budget.id,
    ]);
    expect(activeBudgets.budgets[0]?.limit.amountMinor).toBe(450000n);

    await app.deleteBudget({
      budgetId: created.budget.id,
    });

    const budgetsWithTombstones = await app.listBudgets({
      includeDeleted: true,
      period: "2026-03",
    });
    expect(budgetsWithTombstones.budgets).toHaveLength(1);
    expect(budgetsWithTombstones.budgets[0]?.deletedAt).not.toBeNull();
    expect(updated.budget.limit.amountMinor).toBe(450000n);
  });

  it("runs recurring rules through shared bootstrap wiring", async () => {
    const app = createBootstrap();

    const templateResult = await app.addTransactionTemplate({
      name: "Arriendo",
      accountId: "acc-main",
      amountMinor: -900000,
      currency: "COP",
      categoryId: "home",
    });

    await app.addRecurringRule({
      templateId: templateResult.template.id,
      schedule: {
        frequency: "monthly",
        interval: 1,
        dayOfMonth: 5,
      },
      startsOn: new Date("2026-01-01T00:00:00.000Z"),
    });

    const runResult = await app.runRecurringRules({
      asOf: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(runResult.generatedTransactions).toHaveLength(3);

    const recurringRules = await app.listRecurringRules();
    expect(recurringRules.recurringRules).toHaveLength(1);
    expect(recurringRules.recurringRules[0]?.nextRunOn.toISOString()).toBe(
      "2026-04-05T00:00:00.000Z",
    );
  });

  it("supports bulk transaction quick actions through shared bootstrap wiring", async () => {
    const app = createBootstrap();
    const first = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );
    const second = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -50000,
        categoryId: "transport",
        date: new Date("2026-03-04T10:00:00.000Z"),
      }),
    );

    await app.bulkUpdateTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
      categoryId: "misc",
      tags: ["Quick", "Review"],
    });

    const updatedTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(updatedTransactions.transactions.map((transaction) => transaction.categoryId)).toEqual([
      "misc",
      "misc",
    ]);
    expect(updatedTransactions.transactions[0]?.tags).toEqual(["quick", "review"]);

    await app.bulkDeleteTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
    });

    const activeTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(activeTransactions.transactions).toHaveLength(0);

    const allTransactions = await app.listTransactions({
      accountId: "acc-main",
      includeDeleted: true,
    });
    expect(allTransactions.transactions).toHaveLength(2);
    expect(allTransactions.transactions.every((transaction) => transaction.deletedAt !== null)).toBe(
      true,
    );
  });

  it("lists accounts and categories using shared bootstrap wiring", async () => {
    const app = createBootstrap();

    const initialAccounts = await app.listAccounts();
    expect(initialAccounts.accounts.map((account) => account.id)).toEqual([
      "acc-main",
    ]);

    const categoryResult = await app.addCategory({
      name: "Comida",
      type: "expense",
    });

    const activeCategories = await app.listCategories();
    expect(activeCategories.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);

    await app.deleteCategory({
      categoryId: categoryResult.category.id,
    });

    const categoriesWithTombstones = await app.listCategories({
      includeDeleted: true,
    });
    expect(
      categoriesWithTombstones.categories.map((category) => category.id),
    ).toEqual([categoryResult.category.id]);
  });

  it("exposes account summary query for the home slice", async () => {
    const app = createBootstrap();

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: 300000,
        categoryId: "income",
        date: new Date("2026-03-02T10:00:00.000Z"),
      }),
    );

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -50000,
        categoryId: "transport",
        date: new Date("2026-03-03T12:00:00.000Z"),
      }),
    );

    const summary = await app.getAccountSummary({
      accountId: "acc-main",
      from: new Date("2026-03-01T00:00:00.000Z"),
      to: new Date("2026-03-31T23:59:59.999Z"),
      recentLimit: 2,
      topCategoriesLimit: 2,
    });

    expect(summary.transactionCount).toBe(3);
    expect(summary.totals).toEqual({
      incomeMinor: 300000n,
      expenseMinor: 170000n,
      netMinor: 130000n,
    });
    expect(summary.topExpenseCategories).toEqual([
      {
        categoryId: "food",
        expenseMinor: 120000n,
      },
      {
        categoryId: "transport",
        expenseMinor: 50000n,
      },
    ]);
    expect(summary.recentTransactions.map((transaction) => transaction.categoryId)).toEqual([
      "transport",
      "food",
    ]);
  });

  it("exports and imports business data while resetting local sync state", async () => {
    const source = createBootstrap();
    await source.addCategory({
      name: "Comida",
      type: "expense",
    });
    await source.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );

    const exported = await source.exportData();

    const target = createBootstrap();
    await target.addAccount({
      name: "Cuenta local",
      type: "cash",
      currency: "COP",
    });
    await target.addTransaction(createTransactionInputFixture());

    const pendingBeforeImport = await target.getSyncStatus();
    expect(pendingBeforeImport.counts.pending).toBeGreaterThan(0);

    await target.importData({
      bundle: exported.bundle,
    });

    const accounts = await target.listAccounts();
    expect(accounts.accounts.map((account) => account.id)).toEqual(["acc-main"]);

    const transactions = await target.listTransactions({
      accountId: "acc-main",
    });
    expect(transactions.transactions).toHaveLength(1);
    expect(transactions.transactions[0]?.amount.amountMinor).toBe(-120000n);

    const syncStatus = await target.getSyncStatus();
    expect(syncStatus.status).toBe("synced");
    expect(syncStatus.counts).toEqual({
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    });
  });
});
