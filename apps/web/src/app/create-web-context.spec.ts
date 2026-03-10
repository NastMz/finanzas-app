import { describe, expect, it } from "vitest";

import { createWebContext } from "./create-web-context.js";

describe("createWebContext", () => {
  it("exposes commands and queries for web host composition", async () => {
    const context = createWebContext();

    const initialAccounts = await context.queries.listAccounts();
    expect(initialAccounts.accounts.map((account) => account.id)).toContain(
      "acc-main",
    );

    const categoryResult = await context.commands.addCategory({
      name: "Servicios",
      type: "expense",
    });

    const categories = await context.queries.listCategories();
    expect(categories.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);
  });
});
