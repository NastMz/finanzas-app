import { describe, expect, it } from "vitest";

import {
  createInMemoryBootstrap,
  createInMemoryBootstrapContext,
  type CreateInMemoryBootstrapOptions,
  type InMemoryBootstrapContext,
} from "@finanzas/platform-shared";
import type { SyncApiClient } from "@finanzas/sync";

import { createFinanzasUiService } from "./create-finanzas-ui-service.js";

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
  const ui = createFinanzasUiService(context, {
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
