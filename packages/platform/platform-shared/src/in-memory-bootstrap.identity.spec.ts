import { SequenceIdGenerator } from "@finanzas/data";
import { describe, expect, it } from "vitest";

import {
  ULID_PATTERN,
  createAccountInputFixture,
  createBootstrap,
  createTransactionInputFixture,
  normalizeSegment,
} from "./in-memory-bootstrap.test-helpers.js";

describe("createInMemoryBootstrap", () => {
  it("uses ULID strategy by default for generated ids", async () => {
    const ulidDeviceId = "Platform Device 01";
    const app = createBootstrap({
      deviceId: ulidDeviceId,
    });
    const normalizedDeviceId = normalizeSegment(ulidDeviceId);

    const accountResult = await app.addAccount(createAccountInputFixture());

    expect(accountResult.account.id).toMatch(
      new RegExp(`^acc-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(accountResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );

    const transactionResult = await app.addTransaction(
      createTransactionInputFixture({
        accountId: accountResult.account.id,
        amountMinor: -35000,
        date: new Date("2026-03-03T10:00:00.000Z"),
        categoryId: "misc",
      }),
    );

    expect(transactionResult.transaction.id).toMatch(
      new RegExp(`^tx-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(transactionResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
  });

  it("supports deterministic ids when injected", async () => {
    const deterministicDeviceId = "platform-test-device";
    const normalizedDeviceId = normalizeSegment(deterministicDeviceId);
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
    const app = createBootstrap({
      ids: deterministicIds,
      deviceId: deterministicDeviceId,
    });

    const accountResult = await app.addAccount(
      createAccountInputFixture({
        name: "Cuenta deterministica",
        type: "bank",
      }),
    );
    expect(accountResult.account.id).toBe(`acc-${normalizedDeviceId}-1`);
    expect(accountResult.outboxOpId).toBe(`op-${normalizedDeviceId}-1`);

    const transactionResult = await app.addTransaction(
      createTransactionInputFixture({
        accountId: accountResult.account.id,
        amountMinor: -12000,
        date: new Date("2026-03-03T10:00:00.000Z"),
        categoryId: "misc",
      }),
    );
    expect(transactionResult.transaction.id).toBe(`tx-${normalizedDeviceId}-1`);
    expect(transactionResult.outboxOpId).toBe(`op-${normalizedDeviceId}-2`);
  });
});
