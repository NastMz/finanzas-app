import { SyncError } from "@finanzas/sync";
import { describe, expect, it } from "vitest";

import {
  createBootstrap,
  createFailingPushSyncApiClient,
  createPartialAckSyncApiClient,
  createTestTransactionDate,
  createTransactionInputFixture,
} from "./in-memory-bootstrap.test-helpers.js";

describe("createInMemoryBootstrap", () => {
  it("marks operations as failed when sync push throws", async () => {
    const app = createBootstrap({
      syncApi: createFailingPushSyncApiClient(),
    });

    await app.addTransaction(createTransactionInputFixture());

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);

    const retrySync = await app.syncNow();
    expect(retrySync.pushedOpIds).toEqual([]);
    expect(retrySync.ackedOpIds).toEqual([]);
    expect(retrySync.failedOpIds).toEqual([]);
    expect(retrySync.nextCursor).toBe("0");
  });

  it("runs full transaction lifecycle and syncs changes", async () => {
    const app = createBootstrap();
    const transactionDate = createTestTransactionDate();

    const created = await app.addTransaction(
      createTransactionInputFixture({
        date: transactionDate,
        note: "almuerzo",
        tags: ["Food"],
      }),
    );

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

  it("reports failed operations when server ack is partial", async () => {
    const app = createBootstrap({
      syncApi: createPartialAckSyncApiClient(),
    });

    const created = await app.addTransaction(createTransactionInputFixture());

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

  it("reports sync status for account settings UI", async () => {
    const app = createBootstrap({
      syncApi: createFailingPushSyncApiClient("Offline"),
    });

    const initialStatus = await app.getSyncStatus();
    expect(initialStatus.status).toBe("synced");
    expect(initialStatus.counts).toEqual({
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    });

    await app.addTransaction(createTransactionInputFixture());

    const pendingStatus = await app.getSyncStatus();
    expect(pendingStatus.status).toBe("pending");
    expect(pendingStatus.counts.pending).toBe(1);

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);

    const errorStatus = await app.getSyncStatus();
    expect(errorStatus.status).toBe("error");
    expect(errorStatus.counts.failed).toBe(1);
    expect(errorStatus.lastError).toContain("Offline");
  });
});
