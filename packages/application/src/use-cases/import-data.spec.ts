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
  InMemoryRecurringRuleRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionTemplateRepository,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { exportData } from "./export-data.js";
import { importData } from "./import-data.js";

describe("importData", () => {
  it("replaces the current dataset with the imported business entities", async () => {
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

    const bundle = (
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

    const targetAccounts = new InMemoryAccountRepository([
      createAccount({
        id: "acc-old",
        name: "Cuenta anterior",
        type: "cash",
        currency: "USD",
        createdAt: new Date("2026-02-01T10:00:00.000Z"),
      }),
    ]);
    const targetCategories = new InMemoryCategoryRepository([
      createCategory({
        id: "cat-old",
        name: "Vieja",
        type: "expense",
        createdAt: new Date("2026-02-01T10:00:00.000Z"),
      }),
    ]);
    const targetTransactions = new InMemoryTransactionRepository();

    const result = await importData(
      {
        accounts: targetAccounts,
        categories: targetCategories,
        budgets: new InMemoryBudgetRepository(),
        templates: new InMemoryTransactionTemplateRepository(),
        recurringRules: new InMemoryRecurringRuleRepository(),
        transactions: targetTransactions,
      },
      {
        bundle,
      },
    );

    expect(result.counts).toEqual({
      accounts: 1,
      categories: 1,
      budgets: 0,
      transactionTemplates: 0,
      recurringRules: 0,
      transactions: 1,
    });
    expect((await targetAccounts.listAll()).map((account) => account.id)).toEqual([
      "acc-imported",
    ]);
    expect(
      (await targetCategories.listAll()).map((category) => category.id),
    ).toEqual(["cat-imported"]);
    expect(
      (await targetTransactions.listAll()).map((transaction) => transaction.id),
    ).toEqual(["tx-imported"]);
  });

  it("fails without mutating repositories when the bundle has broken references", async () => {
    const existingAccount = createAccount({
      id: "acc-existing",
      name: "Cuenta existente",
      type: "cash",
      currency: "COP",
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
    });
    const accounts = new InMemoryAccountRepository([existingAccount]);
    const categories = new InMemoryCategoryRepository();

    await expect(
      importData(
        {
          accounts,
          categories,
          budgets: new InMemoryBudgetRepository(),
          templates: new InMemoryTransactionTemplateRepository(),
          recurringRules: new InMemoryRecurringRuleRepository(),
          transactions: new InMemoryTransactionRepository(),
        },
        {
          bundle: {
            format: "finanzas-data",
            version: 1,
            exportedAt: "2026-03-10T12:00:00.000Z",
            entities: {
              accounts: [],
              categories: [],
              budgets: [],
              transactionTemplates: [],
              recurringRules: [],
              transactions: [
                {
                  id: "tx-invalid",
                  accountId: "acc-missing",
                  amountMinor: "-90000",
                  currency: "COP",
                  date: "2026-03-02T10:00:00.000Z",
                  categoryId: "food",
                  note: null,
                  tags: [],
                  createdAt: "2026-03-02T10:00:00.000Z",
                  updatedAt: "2026-03-02T10:00:00.000Z",
                  deletedAt: null,
                  version: null,
                },
              ],
            },
          },
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);

    expect((await accounts.listAll()).map((account) => account.id)).toEqual([
      "acc-existing",
    ]);
    expect(await categories.listAll()).toHaveLength(0);
  });
});
