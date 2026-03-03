import { describe, expect, it } from "vitest";

import { ApplicationError } from "@finanzas/application";
import { DomainError } from "@finanzas/domain";
import { SyncError, type SyncApiClient } from "@finanzas/sync";

import { createWebBootstrap } from "./bootstrap.js";

describe("createWebBootstrap", () => {
  it("runs full transaction lifecycle and syncs changes", async () => {
    const app = createWebBootstrap();
    const transactionDate = new Date("2026-03-02T10:00:00.000Z");

    const created = await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -120000,
      currency: "COP",
      date: transactionDate,
      categoryId: "food",
      note: "almuerzo",
      tags: ["Food"],
    });

    const updated = await app.updateTransaction({
      transactionId: created.transaction.id,
      amountMinor: -145000,
      note: "almuerzo y cafe",
      tags: ["Food", "Cafe", "food"],
    });

    const deleted = await app.deleteTransaction({
      transactionId: created.transaction.id,
    });

    const firstSync = await app.syncNow();

    expect(firstSync.pushedOpIds).toEqual([
      created.outboxOpId,
      updated.outboxOpId,
      deleted.outboxOpId,
    ]);
    expect(firstSync.ackedOpIds).toEqual(firstSync.pushedOpIds);
    expect(firstSync.failedOpIds).toEqual([]);
    expect(firstSync.pulledChanges).toBe(3);
    expect(firstSync.nextCursor).toBe("3");

    const activeTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(activeTransactions.transactions).toHaveLength(0);

    const allTransactions = await app.listTransactions({
      accountId: "acc-main",
      includeDeleted: true,
    });
    expect(allTransactions.transactions).toHaveLength(1);
    expect(allTransactions.transactions[0]?.id).toBe(created.transaction.id);
    expect(allTransactions.transactions[0]?.amount.amountMinor).toBe(-145000n);
    expect(allTransactions.transactions[0]?.note).toBe("almuerzo y cafe");
    expect(allTransactions.transactions[0]?.tags).toEqual(["food", "cafe"]);
    expect(allTransactions.transactions[0]?.deletedAt).not.toBeNull();

    const secondSync = await app.syncNow();
    expect(secondSync.pushedOpIds).toEqual([]);
    expect(secondSync.ackedOpIds).toEqual([]);
    expect(secondSync.failedOpIds).toEqual([]);
    expect(secondSync.pulledChanges).toBe(0);
    expect(secondSync.nextCursor).toBe("3");
  });

  it("marks operations as failed when sync push throws", async () => {
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

    const app = createWebBootstrap({
      syncApi: api,
    });

    await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -120000,
      currency: "COP",
      date: new Date("2026-03-02T10:00:00.000Z"),
      categoryId: "food",
    });

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);

    const retrySync = await app.syncNow();
    expect(retrySync.pushedOpIds).toEqual([]);
    expect(retrySync.ackedOpIds).toEqual([]);
    expect(retrySync.failedOpIds).toEqual([]);
    expect(retrySync.nextCursor).toBe("0");
  });

  it("reports failed operations when server ack is partial", async () => {
    const api: SyncApiClient = {
      async push(request) {
        return {
          ackedOpIds: request.ops.length > 0 ? [request.ops[0]!.opId] : [],
          conflicts: [],
          serverTime: new Date("2026-03-02T10:30:00.000Z"),
        };
      },
      async pull() {
        return {
          nextCursor: "0",
          changes: [],
        };
      },
    };

    const app = createWebBootstrap({
      syncApi: api,
    });

    const created = await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -120000,
      currency: "COP",
      date: new Date("2026-03-02T10:00:00.000Z"),
      categoryId: "food",
    });

    const updated = await app.updateTransaction({
      transactionId: created.transaction.id,
      note: "editado",
    });

    const syncResult = await app.syncNow();
    expect(syncResult.pushedOpIds).toEqual([created.outboxOpId, updated.outboxOpId]);
    expect(syncResult.ackedOpIds).toEqual([created.outboxOpId]);
    expect(syncResult.failedOpIds).toEqual([updated.outboxOpId]);

    const nextSync = await app.syncNow();
    expect(nextSync.pushedOpIds).toEqual([]);
    expect(nextSync.ackedOpIds).toEqual([]);
    expect(nextSync.failedOpIds).toEqual([]);
    expect(nextSync.nextCursor).toBe("0");
  });

  it("generates purpose-scoped ids for entities and outbox ops", async () => {
    const app = createWebBootstrap({
      deviceId: "Device Web 01",
    });

    const accountResult = await app.addAccount({
      name: "Cuenta secundaria",
      type: "cash",
      currency: "COP",
    });

    expect(accountResult.account.id).toBe("acc-device-web-01-1");
    expect(accountResult.outboxOpId).toBe("op-device-web-01-1");

    const transactionResult = await app.addTransaction({
      accountId: accountResult.account.id,
      amountMinor: -50000,
      currency: "COP",
      date: new Date("2026-03-02T11:00:00.000Z"),
      categoryId: "misc",
    });

    expect(transactionResult.transaction.id).toBe("tx-device-web-01-1");
    expect(transactionResult.outboxOpId).toBe("op-device-web-01-2");
  });

  it("fails when deleting a missing transaction", async () => {
    const app = createWebBootstrap();

    await expect(
      app.deleteTransaction({
        transactionId: "tx-missing",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updating a transaction that is already deleted", async () => {
    const app = createWebBootstrap();
    const transactionDate = new Date("2026-03-02T10:00:00.000Z");

    const created = await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -50000,
      currency: "COP",
      date: transactionDate,
      categoryId: "food",
    });

    await app.deleteTransaction({
      transactionId: created.transaction.id,
    });

    await expect(
      app.updateTransaction({
        transactionId: created.transaction.id,
        note: "intento de editar",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updating transaction with invalid currency", async () => {
    const app = createWebBootstrap();
    const transactionDate = new Date("2026-03-02T10:00:00.000Z");

    const created = await app.addTransaction({
      accountId: "acc-main",
      amountMinor: -100000,
      currency: "COP",
      date: transactionDate,
      categoryId: "food",
    });

    await expect(
      app.updateTransaction({
        transactionId: created.transaction.id,
        currency: "USD",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("fails when listing transactions for unknown account", async () => {
    const app = createWebBootstrap();

    await expect(
      app.listTransactions({
        accountId: "acc-missing",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
