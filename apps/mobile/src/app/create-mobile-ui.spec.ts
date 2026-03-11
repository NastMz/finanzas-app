import { describe, expect, it } from "vitest";

import { createMobileContext } from "./create-mobile-context.js";
import { createMobileUi } from "./create-mobile-ui.js";

describe("createMobileUi", () => {
  it("builds the shared UI facade over mobile context", async () => {
    const context = createMobileContext({
      databasePath: ":memory:",
    });
    const ui = createMobileUi(context);

    const home = await ui.loadHomeTab({
      accountId: "acc-main",
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-03-31T23:59:59.999Z"),
      },
    });

    expect(home.account.id).toBe("acc-main");
    expect(home.totals).toEqual({
      incomeMinor: 0n,
      expenseMinor: 0n,
      netMinor: 0n,
    });

    const accountTab = await ui.loadAccountTab();
    expect(accountTab.accounts.active).toBe(1);
  });
});
