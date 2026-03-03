import { describe, expect, it } from "vitest";

import { createInMemoryBootstrap } from "./in-memory-bootstrap.js";
import { createInMemoryBootstrapContext } from "./in-memory-bootstrap-context.js";

describe("createInMemoryBootstrapContext", () => {
  it("exposes command and query facades over the same bootstrap", async () => {
    const bootstrap = createInMemoryBootstrap({
      defaultDeviceId: "platform-context-device",
    });
    const context = createInMemoryBootstrapContext(bootstrap);

    const accountResult = await context.commands.addAccount({
      name: "Cuenta contexto",
      type: "cash",
      currency: "COP",
    });

    const accountListResult = await context.queries.listAccounts();
    expect(accountListResult.accounts.map((account) => account.id)).toContain(
      accountResult.account.id,
    );

    const categoryResult = await context.commands.addCategory({
      name: "Transporte",
      type: "expense",
    });

    const categoryListResult = await context.queries.listCategories();
    expect(categoryListResult.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);
  });
});
