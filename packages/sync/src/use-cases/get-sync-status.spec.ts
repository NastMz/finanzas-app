import { describe, expect, it } from "vitest";

import type { OutboxOp, OutboxStatus } from "@finanzas/application";
import { InMemoryOutboxRepository, InMemorySyncStateRepository } from "@finanzas/data";

import { getSyncStatus } from "./get-sync-status.js";

describe("getSyncStatus", () => {
  it("returns synced when there are no pending or failed operations", async () => {
    const outbox = new InMemoryOutboxRepository();

    const result = await getSyncStatus({
      outbox,
      syncState: new InMemorySyncStateRepository("8"),
    });

    expect(result.status).toBe("synced");
    expect(result.counts).toEqual({
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    });
    expect(result.lastError).toBeNull();
    expect(result.cursor).toBe("8");
  });

  it("returns pending when there are pending or sent operations", async () => {
    const outbox = new InMemoryOutboxRepository();

    await outbox.append(
      createOutboxOperation({
        opId: "op-pending",
        status: "pending",
      }),
    );
    await outbox.append(
      createOutboxOperation({
        opId: "op-sent",
        status: "sent",
      }),
    );
    await outbox.append(
      createOutboxOperation({
        opId: "op-acked",
        status: "acked",
      }),
    );

    const result = await getSyncStatus({
      outbox,
      syncState: new InMemorySyncStateRepository("10"),
    });

    expect(result.status).toBe("pending");
    expect(result.counts).toEqual({
      pending: 1,
      sent: 1,
      failed: 0,
      acked: 1,
    });
    expect(result.lastError).toBeNull();
  });

  it("returns error and latest failure message when failed operations exist", async () => {
    const outbox = new InMemoryOutboxRepository();

    await outbox.append(
      createOutboxOperation({
        opId: "op-failed-1",
        status: "failed",
        createdAt: new Date("2026-03-03T10:00:00.000Z"),
        lastError: "First sync error",
      }),
    );
    await outbox.append(
      createOutboxOperation({
        opId: "op-failed-2",
        status: "failed",
        createdAt: new Date("2026-03-03T12:00:00.000Z"),
        lastError: "Latest sync error",
      }),
    );
    await outbox.append(
      createOutboxOperation({
        opId: "op-pending",
        status: "pending",
      }),
    );

    const result = await getSyncStatus({
      outbox,
      syncState: new InMemorySyncStateRepository("11"),
    });

    expect(result.status).toBe("error");
    expect(result.counts).toEqual({
      pending: 1,
      sent: 0,
      failed: 2,
      acked: 0,
    });
    expect(result.lastError).toBe("Latest sync error");
  });
});

interface OutboxOperationFixtureInput {
  opId: string;
  status: OutboxStatus;
  createdAt?: Date;
  lastError?: string;
}

const createOutboxOperation = (
  input: OutboxOperationFixtureInput,
): OutboxOp => ({
  opId: input.opId,
  deviceId: "mobile-device-1",
  entityType: "transaction",
  entityId: `entity-${input.opId}`,
  opType: "create",
  payload: {
    id: `entity-${input.opId}`,
  },
  createdAt: input.createdAt ?? new Date("2026-03-03T09:00:00.000Z"),
  status: input.status,
  attemptCount: input.status === "pending" ? 0 : 1,
  ...(input.lastError !== undefined ? { lastError: input.lastError } : {}),
});
