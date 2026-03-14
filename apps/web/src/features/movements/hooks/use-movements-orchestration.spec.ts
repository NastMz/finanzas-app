import { describe, expect, it } from "vitest";
import type { FinanzasTransactionItemViewModel } from "@finanzas/ui";

import { resolveNextSelectedTransactionId } from "./use-movements-orchestration.js";

describe("useMovementsOrchestration", () => {
  it("preserves the preferred active transaction after reload", () => {
    const items: FinanzasTransactionItemViewModel[] = [
      {
        id: "tx-1",
        accountId: "acc-main",
        categoryId: "cat-food",
        categoryName: "Comida",
        currency: "COP",
        kind: "expense",
        signedAmountMinor: -12000n,
        amountMinor: 12000n,
        date: new Date("2026-03-03T10:00:00.000Z"),
        note: "almuerzo",
        tags: [],
        deleted: false,
      },
      {
        id: "tx-2",
        accountId: "acc-main",
        categoryId: "cat-salary",
        categoryName: "Salario",
        currency: "COP",
        kind: "income",
        signedAmountMinor: 500000n,
        amountMinor: 500000n,
        date: new Date("2026-03-04T10:00:00.000Z"),
        note: "nomina",
        tags: [],
        deleted: false,
      },
    ];

    expect(resolveNextSelectedTransactionId(items, "tx-2")).toBe("tx-2");
  });
});
