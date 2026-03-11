import { describe, expect, it } from "vitest";

import { createMobileContext } from "./create-mobile-context.js";

describe("createMobileContext", () => {
  it("exposes commands and queries for mobile host composition", async () => {
    const context = createMobileContext({
      databasePath: ":memory:",
    });

    const initialAccounts = await context.queries.listAccounts();
    expect(initialAccounts.accounts.map((account) => account.id)).toContain(
      "acc-main",
    );

    const categoryResult = await context.commands.addCategory({
      name: "Educacion",
      type: "expense",
    });

    const categories = await context.queries.listCategories();
    expect(categories.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);
  });
});
