import { describe, expect, it } from "vitest";

import { createAccount } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { deleteAccount } from "./delete-account.js";

describe("deleteAccount", () => {
  it("tombstones the account and queues a delete outbox operation", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = {
      ...createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt,
      }),
      version: 5,
    };

    const accounts = new InMemoryAccountRepository([existingAccount]);
    const outbox = new InMemoryOutboxRepository();

    const result = await deleteAccount(
      {
        accounts,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["op-del-1"]),
        deviceId: "web-device-1",
      },
      {
        accountId: "acc-main",
      },
    );

    expect(result.account.deletedAt?.toISOString()).toBe("2026-03-02T14:00:00.000Z");
    expect(result.outboxOpId).toBe("op-del-1");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("account");
    expect(pendingOps[0]?.opType).toBe("delete");
    expect(pendingOps[0]?.baseVersion).toBe(5);
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "acc-main",
    });
  });

  it("fails when account does not exist", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      deleteAccount(
        {
          accounts: new InMemoryAccountRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-missing"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-missing",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when account is already deleted", async () => {
    const createdAt = new Date("2026-03-01T10:00:00.000Z");
    const deletedAt = new Date("2026-03-02T14:00:00.000Z");
    const now = new Date("2026-03-02T15:00:00.000Z");
    const deletedAccount = {
      ...createAccount({
        id: "acc-main",
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
        createdAt,
      }),
      updatedAt: deletedAt,
      deletedAt,
    };

    await expect(
      deleteAccount(
        {
          accounts: new InMemoryAccountRepository([deletedAccount]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["op-deleted"]),
          deviceId: "web-device-1",
        },
        {
          accountId: "acc-main",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
