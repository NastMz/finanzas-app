import { describe, expect, it } from "vitest";

import {
  createInMemoryBootstrap,
  createInMemoryBootstrapContext,
  type CreateInMemoryBootstrapOptions,
  type InMemoryBootstrapContext,
} from "@finanzas/platform-shared";
import type { SyncApiClient } from "@finanzas/sync";

import {
  createFinanzasUiService,
  selectFinanzasUiDependencies,
} from "./create-finanzas-ui-service.js";

const FIXED_NOW = new Date("2026-03-03T10:00:00.000Z");

describe("createFinanzasUiService", () => {
  it("loads Home tab with totals, top categories and sync badge", async () => {
    const { context, ui } = createUi();

    const foodCategory = await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });

    const transportCategory = await context.commands.addCategory({
      name: "Transporte",
      type: "expense",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -10000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
      note: "almuerzo",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: 50000,
      currency: "COP",
      categoryId: "income",
      date: new Date("2026-03-03T09:00:00.000Z"),
      note: "reembolso",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -20000,
      currency: "COP",
      categoryId: transportCategory.category.id,
      date: new Date("2026-03-02T09:00:00.000Z"),
      note: "taxi",
    });

    const home = await ui.loadHomeTab({
      accountId: "acc-main",
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
        label: "Marzo",
      },
    });

    expect(home.period.label).toBe("Marzo");
    expect(home.totals).toEqual({
      incomeMinor: 50000n,
      expenseMinor: 30000n,
      netMinor: 20000n,
    });
    expect(home.topExpenseCategories[0]?.expenseMinor).toBe(20000n);
    expect(home.topExpenseCategories).toHaveLength(2);
    expect(home.recentTransactions).toHaveLength(3);
    expect(home.sync.status).toBe("pending");
  });

  it("loads Register tab defaults with suggested expense categories", async () => {
    const { context, ui } = createUi();

    const foodCategory = await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });
    const transportCategory = await context.commands.addCategory({
      name: "Transporte",
      type: "expense",
    });
    await context.commands.addCategory({
      name: "Salario",
      type: "income",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -15000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -7000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-02T10:00:00.000Z"),
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -3000,
      currency: "COP",
      categoryId: transportCategory.category.id,
      date: new Date("2026-03-01T10:00:00.000Z"),
    });

    const register = await ui.loadRegisterTab({
      accountId: "acc-main",
      suggestedCategoryLimit: 2,
    });

    expect(register.defaultDate.toISOString()).toBe(FIXED_NOW.toISOString());
    expect(register.suggestedCategoryIds).toEqual([
      foodCategory.category.id,
      transportCategory.category.id,
    ]);
    expect(register.defaultCategoryId).toBe(foodCategory.category.id);
    expect(register.categories.map((category) => category.type)).toContain("income");
    expect(register.categoryManagement.status).toBe("ready");
    expect(register.categoryManagement.coverageByKind.expense.count).toBe(2);
    expect(register.categoryManagement.coverageByKind.income.count).toBe(1);
  });

  it("exposes onboarding state when no categories exist", async () => {
    const { ui } = createUi();

    const register = await ui.loadRegisterTab({
      accountId: "acc-main",
    });

    expect(register.categories).toHaveLength(0);
    expect(register.defaultCategoryId).toBeNull();
    expect(register.categoryManagement.status).toBe("empty");
    expect(register.categoryManagement.activeCount).toBe(0);
    expect(register.categoryManagement.coverageByKind.expense.count).toBe(0);
    expect(register.categoryManagement.coverageByKind.income.count).toBe(0);
    expect(register.categoryManagement.missingTypes).toEqual(["expense", "income"]);
    expect(register.categoryManagement.createAction.supportedTypes).toEqual([
      "expense",
      "income",
    ]);
  });

  it("marks one-sided catalogs as partial and exposes the missing kind", async () => {
    const { ui, context } = createUi();

    await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });

    const register = await ui.loadRegisterTab({
      accountId: "acc-main",
    });

    expect(register.categoryManagement.status).toBe("partial");
    expect(register.categoryManagement.availableTypes).toEqual(["expense"]);
    expect(register.categoryManagement.missingTypes).toEqual(["income"]);
    expect(register.categoryManagement.canonicalSurface).toBe("account");
    expect(register.categoryManagement.recoveryActions.register.supportedTypes).toEqual(["income"]);
  });

  it("keeps register partial until the missing type is created", async () => {
    const { ui } = createUi();

    const created = await ui.createCategory({
      name: "Salario",
      type: "income",
    });
    const register = await ui.loadRegisterTab({
      accountId: "acc-main",
    });

    expect(created.categoryId).toBeTruthy();
    expect(created.outboxOpId).toBeTruthy();
    expect(register.categoryManagement.status).toBe("partial");
    expect(register.categoryManagement.missingTypes).toEqual(["expense"]);
    expect(register.categoryManagement.coverageByKind.income.count).toBe(1);
    expect(register.categories.map((category) => category.name)).toContain("Salario");
  });

  it("recovers account coverage after creating the missing type from a partial state", async () => {
    const { ui } = createUi();

    await ui.createCategory({
      name: "Comida",
      type: "expense",
    });
    const partialAccount = await ui.loadAccountTab();

    await ui.createCategory({
      name: "Salario",
      type: "income",
    });
    const recoveredAccount = await ui.loadAccountTab();

    expect(partialAccount.categoryManagement.status).toBe("partial");
    expect(partialAccount.categoryManagement.missingTypes).toEqual(["income"]);
    expect(recoveredAccount.categoryManagement.status).toBe("ready");
    expect(recoveredAccount.categoryManagement.missingTypes).toEqual([]);
  });

  it("exposes movements category guard metadata for empty expense catalogs", async () => {
    const { ui, context } = createUi();

    const incomeCategory = await context.commands.addCategory({
      name: "Salario",
      type: "income",
    });
    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: 150000,
      currency: "COP",
      categoryId: incomeCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
    });

    const movements = await ui.loadMovementsTab({
      hostAccountId: "acc-main",
      review: {
        filters: {
          includeDeleted: true,
        },
      },
    });

    expect(movements.categoryManagement.status).toBe("partial");
    expect(movements.categoryManagement.coverageByKind.expense.count).toBe(0);
    expect(movements.categoryManagement.coverageByKind.income.count).toBe(1);
    expect(movements.categoryManagement.guardMessageByKind.expense).toContain("gasto");
    expect(movements.review?.filters.accountId).toBe("acc-main");
    expect(movements.review?.page.hasMore).toBe(false);
    expect(movements.accountOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "acc-main",
        }),
      ]),
    );
    expect(movements.totals.byCurrency).toEqual([
      {
        currency: "COP",
        incomeMinor: 150000n,
        expenseMinor: 0n,
      },
    ]);
  });

  it("loads movements without user filters using an explicit complete review state", async () => {
    const { ui, context } = createUi();

    const foodCategory = await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });
    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -12000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
      note: "almuerzo",
    });

    const movements = await ui.loadMovementsTab({
      hostAccountId: "acc-main",
    });

    expect(movements.review).toEqual({
      filters: {
        dateRange: {
          from: null,
          to: null,
        },
        accountId: "acc-main",
        categoryId: null,
        includeDeleted: false,
      },
      page: {
        limit: 50,
        hasMore: false,
        nextContinuation: null,
      },
      mode: "replace",
      scopeLabel: "Cuenta principal (COP)",
    });
    expect(movements.items.map((movement) => movement.id)).toHaveLength(1);
  });

  it("preserves categoryId end to end when loading filtered movements", async () => {
    const { ui, context } = createUi();

    const foodCategory = await context.commands.addCategory({
      name: "Comida",
      type: "expense",
    });
    const transportCategory = await context.commands.addCategory({
      name: "Transporte",
      type: "expense",
    });

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -12000,
      currency: "COP",
      categoryId: foodCategory.category.id,
      date: new Date("2026-03-03T10:00:00.000Z"),
      note: "almuerzo",
    });
    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -8000,
      currency: "COP",
      categoryId: transportCategory.category.id,
      date: new Date("2026-03-02T10:00:00.000Z"),
      note: "taxi",
    });

    const movements = await ui.loadMovementsTab({
      hostAccountId: "acc-main",
      review: {
        filters: {
          categoryId: foodCategory.category.id,
        },
      },
    });

    expect(movements.review?.filters.categoryId).toBe(foodCategory.category.id);
    expect(movements.items).toHaveLength(1);
    expect(movements.items[0]?.categoryId).toBe(foodCategory.category.id);
    expect(movements.items[0]?.note).toBe("almuerzo");
  });

  it("quick-add normalizes expense sign and returns sync status", async () => {
    const { context, ui } = createUi();

    const result = await ui.quickAddTransaction({
      accountId: "acc-main",
      amountMinor: 25000,
      kind: "expense",
      categoryId: "food",
      note: "almuerzo rapido",
    });

    const transactions = await context.queries.listTransactions({
      accountId: "acc-main",
    });

    expect(result.kind).toBe("expense");
    expect(result.signedAmountMinor).toBe(-25000n);
    expect(result.currency).toBe("COP");
    expect(result.sync.status).toBe("pending");
    expect(transactions.transactions[0]?.amount.amountMinor).toBe(-25000n);
    expect(transactions.transactions[0]?.note).toBe("almuerzo rapido");
  });

  it("returns sync error status after failed manual sync", async () => {
    const failingApi = createFailingPushSyncApiClient("Offline");
    const { ui } = createUi({
      syncApi: failingApi,
    });

    await ui.quickAddTransaction({
      accountId: "acc-main",
      amountMinor: 12000,
      categoryId: "food",
    });

    const syncResult = await ui.syncNow();
    expect(syncResult.ok).toBe(false);
    expect(syncResult.error).toContain("Offline");
    expect(syncResult.sync.status).toBe("error");
    expect(syncResult.sync.failedOps).toBe(1);

    const accountTab = await ui.loadAccountTab();
    expect(accountTab.sync.status).toBe("error");
    expect(accountTab.sync.failedOps).toBe(1);
    expect(accountTab.accounts.active).toBe(1);
    expect(accountTab.categories.total).toBe(0);
  });
});

interface CreateUiResult {
  context: InMemoryBootstrapContext;
  ui: ReturnType<typeof createFinanzasUiService>;
}

const createUi = (
  options: Omit<CreateInMemoryBootstrapOptions, "defaultDeviceId"> = {},
): CreateUiResult => {
  const bootstrap = createInMemoryBootstrap({
    defaultDeviceId: "ui-test-device",
    ...options,
  });
  const context = createInMemoryBootstrapContext(bootstrap);
  const ui = createFinanzasUiService(selectFinanzasUiDependencies(context), {
    now: () => FIXED_NOW,
  });

  return {
    context,
    ui,
  };
};

const createFailingPushSyncApiClient = (
  errorMessage: string,
): SyncApiClient => ({
  async push() {
    throw new Error(errorMessage);
  },
  async pull() {
    return {
      nextCursor: "0",
      changes: [],
    };
  },
});
