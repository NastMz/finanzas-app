import { describe, expect, it } from "vitest";

import {
  createAccount,
  createBudget,
  createCategory,
  createMoney,
  createRecurringRule,
  createTransaction,
  createTransactionTemplate,
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

import { exportData } from "./export-data.js";

describe("exportData", () => {
  it("exports a deterministic bundle with all business entities", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const exportedAt = new Date("2026-03-10T12:00:00.000Z");
    const account = {
      ...createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt,
      }),
      version: 2,
    };
    const category = {
      ...createCategory({
        id: "cat-food",
        name: "Comida",
        type: "expense",
        createdAt,
      }),
      deletedAt: new Date("2026-03-05T10:00:00.000Z"),
      updatedAt: new Date("2026-03-05T10:00:00.000Z"),
      version: 3,
    };
    const budget = {
      ...createBudget({
        id: "bud-1",
        categoryId: category.id,
        period: "2026-03",
        limit: createMoney(500000, "COP"),
        createdAt,
      }),
      version: 4,
    };
    const template = {
      ...createTransactionTemplate(
        {
          id: "tpl-1",
          name: "Mercado",
          accountId: account.id,
          amount: createMoney(-200000, "COP"),
          categoryId: category.id,
          note: "supermercado",
          tags: ["Food", "Home"],
          createdAt,
        },
        account,
      ),
      version: 5,
    };
    const recurringRule = {
      ...createRecurringRule({
        id: "rrl-1",
        templateId: template.id,
        schedule: {
          frequency: "monthly",
          interval: 1,
          dayOfMonth: 5,
        },
        startsOn: new Date("2026-03-01T00:00:00.000Z"),
        createdAt,
      }),
      version: 6,
    };
    const transaction = {
      ...createTransaction(
        {
          id: "tx-1",
          accountId: account.id,
          amount: createMoney(-120000, "COP"),
          date: new Date("2026-03-03T10:00:00.000Z"),
          categoryId: category.id,
          note: "almuerzo",
          tags: ["Food"],
          createdAt,
        },
        account,
      ),
      version: 7,
    };

    const result = await exportData({
      accounts: new InMemoryAccountRepository([account]),
      categories: new InMemoryCategoryRepository([category]),
      budgets: new InMemoryBudgetRepository([budget]),
      templates: new InMemoryTransactionTemplateRepository([template]),
      recurringRules: new InMemoryRecurringRuleRepository([recurringRule]),
      transactions: new InMemoryTransactionRepository([transaction]),
      clock: new FixedClock(exportedAt),
    });

    expect(result.bundle).toEqual({
      format: "finanzas-data",
      version: 1,
      exportedAt: exportedAt.toISOString(),
      entities: {
        accounts: [
          {
            id: "acc-main",
            name: "Cuenta principal",
            type: "bank",
            currency: "COP",
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            deletedAt: null,
            version: 2,
          },
        ],
        categories: [
          {
            id: "cat-food",
            name: "Comida",
            type: "expense",
            createdAt: createdAt.toISOString(),
            updatedAt: "2026-03-05T10:00:00.000Z",
            deletedAt: "2026-03-05T10:00:00.000Z",
            version: 3,
          },
        ],
        budgets: [
          {
            id: "bud-1",
            categoryId: "cat-food",
            period: "2026-03",
            limitAmountMinor: "500000",
            currency: "COP",
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            deletedAt: null,
            version: 4,
          },
        ],
        transactionTemplates: [
          {
            id: "tpl-1",
            name: "Mercado",
            accountId: "acc-main",
            amountMinor: "-200000",
            currency: "COP",
            categoryId: "cat-food",
            note: "supermercado",
            tags: ["food", "home"],
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            deletedAt: null,
            version: 5,
          },
        ],
        recurringRules: [
          {
            id: "rrl-1",
            templateId: "tpl-1",
            schedule: {
              frequency: "monthly",
              interval: 1,
              dayOfMonth: 5,
            },
            startsOn: "2026-03-01T00:00:00.000Z",
            nextRunOn: "2026-03-05T00:00:00.000Z",
            lastGeneratedOn: null,
            isActive: true,
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            deletedAt: null,
            version: 6,
          },
        ],
        transactions: [
          {
            id: "tx-1",
            accountId: "acc-main",
            amountMinor: "-120000",
            currency: "COP",
            date: "2026-03-03T10:00:00.000Z",
            categoryId: "cat-food",
            note: "almuerzo",
            tags: ["food"],
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
            deletedAt: null,
            version: 7,
          },
        ],
      },
    });
  });
});
