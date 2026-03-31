import { describe, expect, it } from "vitest";

import {
  createAccount,
  createCategory,
  createMoney,
  createTransaction,
} from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryBudgetRepository,
  InMemoryCategoryRepository,
  InMemoryOutboxRepository,
  InMemoryRecurringRuleRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionTemplateRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { createFinanzasApplicationSurface } from "./create-finanzas-application-surface.js";
import type { FinanzasApplicationSurfaceDependencies } from "./types/finanzas-application-surface.js";
import { exportData } from "./use-cases/export-data.js";

describe("createFinanzasApplicationSurface", () => {
  it("binds representative mutation behavior through the canonical surface", async () => {
    const surface = createFinanzasApplicationSurface(createDependencies());

    const result = await surface.addAccount({
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
    });

    expect(result.account.id).toBe("acc-1");
    expect(result.outboxOpId).toBe("op-1");
    expect(await surface.listAccounts()).toEqual({
      accounts: [result.account],
    });
  });

  it("binds representative query behavior through the canonical surface", async () => {
    const now = new Date("2026-03-05T09:00:00.000Z");
    const surface = createFinanzasApplicationSurface(
      createDependencies({
        accountSeed: [
          createAccount({
            id: "acc-1",
            name: "Cuenta principal",
            type: "bank",
            currency: "COP",
            createdAt: now,
          }),
        ],
      }),
    );

    expect(await surface.listAccounts()).toEqual({
      accounts: [
        createAccount({
          id: "acc-1",
          name: "Cuenta principal",
          type: "bank",
          currency: "COP",
          createdAt: now,
        }),
      ],
    });
  });

  it("preserves import and export behavior through the canonical surface", async () => {
    const bundle = await createImportBundle();
    const surface = createFinanzasApplicationSurface(createDependencies());

    const importResult = await surface.importData({ bundle });

    expect(importResult.counts).toEqual({
      accounts: 1,
      categories: 1,
      budgets: 0,
      transactionTemplates: 0,
      recurringRules: 0,
      transactions: 1,
    });
    const exported = await surface.exportData();
    expect(exported.bundle.entities.accounts).toHaveLength(1);
    expect(exported.bundle.entities.categories).toHaveLength(1);
    expect(exported.bundle.entities.transactions).toHaveLength(1);
  });
});

interface CreateDependenciesOptions {
  accountSeed?: ConstructorParameters<typeof InMemoryAccountRepository>[0];
}

const createDependencies = (
  options: CreateDependenciesOptions = {},
): FinanzasApplicationSurfaceDependencies => ({
  accounts: new InMemoryAccountRepository(options.accountSeed),
  budgets: new InMemoryBudgetRepository(),
  categories: new InMemoryCategoryRepository(),
  recurringRules: new InMemoryRecurringRuleRepository(),
  transactions: new InMemoryTransactionRepository(),
  transactionTemplates: new InMemoryTransactionTemplateRepository(),
  outbox: new InMemoryOutboxRepository(),
  clock: new FixedClock(new Date("2026-03-10T12:00:00.000Z")),
  ids: new SequenceIdGenerator(["acc-1", "op-1"]),
  deviceId: "web-device-1",
});

const createImportBundle = async (): Promise<
Awaited<ReturnType<typeof exportData>>["bundle"]
> => {
  const sourceCreatedAt = new Date("2026-03-01T10:00:00.000Z");
  const sourceAccount = createAccount({
    id: "acc-imported",
    name: "Cuenta importada",
    type: "bank",
    currency: "COP",
    createdAt: sourceCreatedAt,
  });
  const sourceCategory = createCategory({
    id: "cat-imported",
    name: "Comida",
    type: "expense",
    createdAt: sourceCreatedAt,
  });
  const sourceTransaction = createTransaction(
    {
      id: "tx-imported",
      accountId: sourceAccount.id,
      amount: createMoney(-90000, "COP"),
      date: new Date("2026-03-02T10:00:00.000Z"),
      categoryId: sourceCategory.id,
      note: "mercado",
      tags: ["Food"],
      createdAt: sourceCreatedAt,
    },
    sourceAccount,
  );

  return (
    await exportData({
      accounts: new InMemoryAccountRepository([sourceAccount]),
      categories: new InMemoryCategoryRepository([sourceCategory]),
      budgets: new InMemoryBudgetRepository(),
      templates: new InMemoryTransactionTemplateRepository(),
      recurringRules: new InMemoryRecurringRuleRepository(),
      transactions: new InMemoryTransactionRepository([sourceTransaction]),
      clock: new FixedClock(new Date("2026-03-10T12:00:00.000Z")),
    })
  ).bundle;
};
