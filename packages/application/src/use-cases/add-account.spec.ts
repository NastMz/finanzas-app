import { describe, expect, it } from "vitest";

import { createAccount, DomainError } from "@finanzas/domain";
import {
  FixedClock,
  InMemoryAccountRepository,
  InMemoryOutboxRepository,
  SequenceIdGenerator,
} from "@finanzas/data";

import { ApplicationError } from "../errors.js";
import { addAccount } from "./add-account.js";

describe("addAccount", () => {
  it("stores the account and queues an outbox operation", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const accounts = new InMemoryAccountRepository();
    const outbox = new InMemoryOutboxRepository();

    const result = await addAccount(
      {
        accounts,
        outbox,
        clock: new FixedClock(now),
        ids: new SequenceIdGenerator(["acc-1", "op-1"]),
        deviceId: "web-device-1",
      },
      {
        name: "Cuenta principal",
        type: "bank",
        currency: "COP",
      },
    );

    expect(result.account.id).toBe("acc-1");
    expect(result.outboxOpId).toBe("op-1");

    const storedAccount = await accounts.findById("acc-1");
    expect(storedAccount?.name).toBe("Cuenta principal");

    const pendingOps = await outbox.listPending();
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0]?.entityType).toBe("account");
    expect(pendingOps[0]?.payload).toMatchObject({
      id: "acc-1",
      currency: "COP",
    });
  });

  it("fails when generated account id already exists", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");
    const existingAccount = createAccount({
      id: "acc-main",
      name: "Cuenta principal",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    await expect(
      addAccount(
        {
          accounts: new InMemoryAccountRepository([existingAccount]),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["acc-main", "op-duplicate"]),
          deviceId: "web-device-1",
        },
        {
          name: "Cuenta secundaria",
          type: "cash",
          currency: "COP",
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when account currency is invalid", async () => {
    const now = new Date("2026-03-02T14:00:00.000Z");

    await expect(
      addAccount(
        {
          accounts: new InMemoryAccountRepository(),
          outbox: new InMemoryOutboxRepository(),
          clock: new FixedClock(now),
          ids: new SequenceIdGenerator(["acc-invalid", "op-invalid"]),
          deviceId: "web-device-1",
        },
        {
          name: "Cuenta invalida",
          type: "bank",
          currency: "INVALID",
        },
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
