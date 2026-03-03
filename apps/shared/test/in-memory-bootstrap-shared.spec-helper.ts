import type { IdGenerator } from "@finanzas/application";
import { SequenceIdGenerator } from "@finanzas/data";
import type { InMemoryBootstrap } from "@finanzas/platform-shared";
import { SyncError, type SyncApiClient } from "@finanzas/sync";
import { expect, it } from "vitest";

interface BootstrapCreationOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export interface SharedInMemoryBootstrapTestsOptions {
  createBootstrap(options?: BootstrapCreationOptions): InMemoryBootstrap;
  ulidDeviceId: string;
  deterministicDeviceId: string;
}

/**
 * Registers shared tests that every host bootstrap should satisfy.
 */
export const runSharedInMemoryBootstrapTests = (
  options: SharedInMemoryBootstrapTestsOptions,
): void => {
  it("uses ULID strategy by default for generated ids", async () => {
    const app = options.createBootstrap({
      deviceId: options.ulidDeviceId,
    });
    const normalizedDeviceId = normalizeSegment(options.ulidDeviceId);

    const accountResult = await app.addAccount({
      name: "Cuenta pruebas",
      type: "cash",
      currency: "COP",
    });

    expect(accountResult.account.id).toMatch(
      new RegExp(`^acc-${normalizedDeviceId}-[0-9A-HJKMNP-TV-Z]{26}$`),
    );
    expect(accountResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-[0-9A-HJKMNP-TV-Z]{26}$`),
    );

    const transactionResult = await app.addTransaction({
      accountId: accountResult.account.id,
      amountMinor: -35000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "misc",
    });

    expect(transactionResult.transaction.id).toMatch(
      new RegExp(`^tx-${normalizedDeviceId}-[0-9A-HJKMNP-TV-Z]{26}$`),
    );
    expect(transactionResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-[0-9A-HJKMNP-TV-Z]{26}$`),
    );
  });

  it("supports deterministic ids when injected", async () => {
    const normalizedDeviceId = normalizeSegment(options.deterministicDeviceId);
    const deterministicIds = new SequenceIdGenerator([
      {
        id: `acc-${normalizedDeviceId}-1`,
        purpose: "account",
      },
      {
        id: `op-${normalizedDeviceId}-1`,
        purpose: "outbox-op",
      },
      {
        id: `tx-${normalizedDeviceId}-1`,
        purpose: "transaction",
      },
      {
        id: `op-${normalizedDeviceId}-2`,
        purpose: "outbox-op",
      },
    ]);
    const app = options.createBootstrap({
      ids: deterministicIds,
      deviceId: options.deterministicDeviceId,
    });

    const accountResult = await app.addAccount({
      name: "Cuenta deterministica",
      type: "bank",
      currency: "COP",
    });
    expect(accountResult.account.id).toBe(`acc-${normalizedDeviceId}-1`);
    expect(accountResult.outboxOpId).toBe(`op-${normalizedDeviceId}-1`);

    const transactionResult = await app.addTransaction({
      accountId: accountResult.account.id,
      amountMinor: -12000,
      currency: "COP",
      date: new Date("2026-03-03T10:00:00.000Z"),
      categoryId: "misc",
    });
    expect(transactionResult.transaction.id).toBe(`tx-${normalizedDeviceId}-1`);
    expect(transactionResult.outboxOpId).toBe(`op-${normalizedDeviceId}-2`);
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
    const app = options.createBootstrap({
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
};

const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
