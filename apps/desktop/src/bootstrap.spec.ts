import { describe, expect, it } from "vitest";

import { SequenceIdGenerator } from "@finanzas/data";
import { SyncError, type SyncApiClient } from "@finanzas/sync";

import { createDesktopBootstrap } from "./bootstrap.js";

describe("createDesktopBootstrap", () => {
  it("uses ULID strategy by default for generated ids", async () => {
    const app = createDesktopBootstrap({
      deviceId: "Desktop QA 01",
    });

    const accountResult = await app.addAccount({
      name: "Caja",
      type: "cash",
      currency: "COP",
    });

    expect(accountResult.account.id).toMatch(
      /^acc-desktop-qa-01-[0-9A-HJKMNP-TV-Z]{26}$/,
    );
    expect(accountResult.outboxOpId).toMatch(
      /^op-desktop-qa-01-[0-9A-HJKMNP-TV-Z]{26}$/,
    );

    const transactionResult = await app.addTransaction({
      accountId: accountResult.account.id,
      amountMinor: -35000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "misc",
    });

    expect(transactionResult.transaction.id).toMatch(
      /^tx-desktop-qa-01-[0-9A-HJKMNP-TV-Z]{26}$/,
    );
    expect(transactionResult.outboxOpId).toMatch(
      /^op-desktop-qa-01-[0-9A-HJKMNP-TV-Z]{26}$/,
    );
  });

  it("supports deterministic ids when injected", async () => {
    const ids = new SequenceIdGenerator([
      {
        id: "acc-d-1",
        purpose: "account",
      },
      {
        id: "op-d-1",
        purpose: "outbox-op",
      },
      {
        id: "tx-d-1",
        purpose: "transaction",
      },
      {
        id: "op-d-2",
        purpose: "outbox-op",
      },
    ]);
    const app = createDesktopBootstrap({
      ids,
      deviceId: "desktop-test-device",
    });

    const accountResult = await app.addAccount({
      name: "Cuenta pruebas",
      type: "bank",
      currency: "COP",
    });
    expect(accountResult.account.id).toBe("acc-d-1");
    expect(accountResult.outboxOpId).toBe("op-d-1");

    const transactionResult = await app.addTransaction({
      accountId: "acc-d-1",
      amountMinor: -12000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "misc",
    });
    expect(transactionResult.transaction.id).toBe("tx-d-1");
    expect(transactionResult.outboxOpId).toBe("op-d-2");
  });

  it("propagates sync error when push fails", async () => {
    const api: SyncApiClient = {
      async push() {
        throw new Error("Network unavailable");
      },
      async pull() {
        return {
          nextCursor: "0",
          changes: [],
        };
      },
    };
    const app = createDesktopBootstrap({
      syncApi: api,
    });

    await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -25000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "misc",
    });

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);
  });
});
