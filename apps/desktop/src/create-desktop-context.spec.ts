import { describe, expect, it } from "vitest";

import { createDesktopContext } from "./create-desktop-context.js";

describe("createDesktopContext", () => {
  it("exposes commands and queries for desktop host composition", async () => {
    const context = createDesktopContext();

    const initialAccounts = await context.queries.listAccounts();
    expect(initialAccounts.accounts.map((account) => account.id)).toContain(
      "acc-main",
    );

    const categoryResult = await context.commands.addCategory({
      name: "Salud",
      type: "expense",
    });

    const categories = await context.queries.listCategories();
    expect(categories.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);
  });
});
