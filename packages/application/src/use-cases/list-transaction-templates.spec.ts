import { describe, expect, it } from "vitest";

import {
  createAccount,
  createMoney,
  createTransactionTemplate,
} from "@finanzas/domain";
import { InMemoryTransactionTemplateRepository } from "@finanzas/data";

import { listTransactionTemplates } from "./list-transaction-templates.js";

describe("listTransactionTemplates", () => {
  it("lists templates excluding tombstones by default", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");
    const account = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const result = await listTransactionTemplates(
      {
        templates: new InMemoryTransactionTemplateRepository([
          createTransactionTemplate(
            {
              id: "tpl-b",
              name: "Beta",
              accountId: "acc-main",
              amount: createMoney(-100, "COP"),
              categoryId: "misc",
              createdAt: now,
            },
            account,
          ),
          {
            ...createTransactionTemplate(
              {
                id: "tpl-deleted",
                name: "Deleted",
                accountId: "acc-main",
                amount: createMoney(-100, "COP"),
                categoryId: "misc",
                createdAt: now,
              },
              account,
            ),
            deletedAt: now,
          },
          createTransactionTemplate(
            {
              id: "tpl-a",
              name: "Alpha",
              accountId: "acc-main",
              amount: createMoney(-100, "COP"),
              categoryId: "misc",
              createdAt: now,
            },
            account,
          ),
        ]),
      },
      {},
    );

    expect(result.templates.map((template) => template.id)).toEqual([
      "tpl-a",
      "tpl-b",
    ]);
  });
});
