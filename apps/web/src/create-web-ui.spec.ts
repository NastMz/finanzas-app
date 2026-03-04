import { describe, expect, it } from "vitest";

import { createWebContext } from "./create-web-context.js";
import { createWebUi } from "./create-web-ui.js";

describe("createWebUi", () => {
  it("builds the shared UI facade over web context", async () => {
    const context = createWebContext();
    const ui = createWebUi(context);

    await context.commands.addTransaction({
      accountId: "acc-main",
      amountMinor: -32000,
      currency: "COP",
      categoryId: "food",
      date: new Date("2026-03-03T10:00:00.000Z"),
      note: "almuerzo web",
    });

    const movements = await ui.loadMovementsTab({
      accountId: "acc-main",
    });
    expect(movements.items).toHaveLength(1);
    expect(movements.items[0]?.signedAmountMinor).toBe(-32000n);
    expect(movements.sync.status).toBe("pending");

    const accountTab = await ui.loadAccountTab();
    expect(accountTab.sync.status).toBe("pending");
    expect(accountTab.accounts.active).toBe(1);
  });
});
