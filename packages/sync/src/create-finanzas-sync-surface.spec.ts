import { describe, expect, it } from "vitest";

import type { OutboxOp } from "@finanzas/application";
import { InMemoryOutboxRepository, InMemorySyncStateRepository } from "@finanzas/data";

import { createFinanzasSyncSurface } from "./create-finanzas-sync-surface.js";
import type {
  FinanzasSyncSurfaceDependencies,
} from "./types/finanzas-sync-surface.js";
import type {
  SyncApiClient,
  SyncChange,
  SyncPullRequest,
  SyncPushRequest,
} from "./ports.js";

describe("createFinanzasSyncSurface", () => {
  it("reports sync status through the canonical surface", async () => {
    const surface = createFinanzasSyncSurface(
      await createDependencies({
        outboxSeed: [
          createOutboxOperation({
            opId: "op-failed",
            status: "failed",
            lastError: "Latest sync error",
          }),
        ],
        cursor: "11",
      }),
    );

    expect(await surface.getSyncStatus()).toEqual({
      status: "error",
      counts: {
        pending: 0,
        sent: 0,
        failed: 1,
        acked: 0,
      },
      cursor: "11",
      lastError: "Latest sync error",
    });
  });

  it("executes sync and updates status through the canonical surface", async () => {
    const surface = createFinanzasSyncSurface(
      await createDependencies({
        outboxSeed: [createOutboxOperation({ opId: "op-1", status: "pending" })],
        cursor: "0",
        nextCursor: "7",
        pulledChanges: [
          {
            changeId: "chg-1",
            entityType: "transaction",
            entityId: "tx-1",
            opType: "create",
            payload: {
              id: "tx-1",
            },
            serverVersion: 1,
            serverTimestamp: new Date("2026-03-04T11:00:00.000Z"),
          },
        ],
      }),
    );

    expect(await surface.syncNow()).toEqual({
      pushedOpIds: ["op-1"],
      ackedOpIds: ["op-1"],
      failedOpIds: [],
      pulledChanges: 1,
      nextCursor: "7",
    });
    expect(await surface.getSyncStatus()).toEqual({
      status: "synced",
      counts: {
        pending: 0,
        sent: 0,
        failed: 0,
        acked: 1,
      },
      cursor: "7",
      lastError: null,
    });
  });

  it("preserves reset policy behavior through the canonical surface", async () => {
    const surfaceDependencies = await createDependencies({
      outboxSeed: [createOutboxOperation({ opId: "op-reset", status: "pending" })],
      cursor: "5",
    });

    const surface = createFinanzasSyncSurface(surfaceDependencies);

    await surface.resetState();

    expect(await surfaceDependencies.outbox.listAll()).toEqual([]);
    expect(await surfaceDependencies.syncState.getCursor()).toBe("0");
  });
});

interface CreateDependenciesOptions {
  outboxSeed?: OutboxOp[];
  cursor?: string | null;
  nextCursor?: string;
  pulledChanges?: SyncChange[];
}

const createDependencies = async (
  options: CreateDependenciesOptions = {},
): Promise<FinanzasSyncSurfaceDependencies> => {
  const outbox = new InMemoryOutboxRepository();

  const api: SyncApiClient = {
    async push(request: SyncPushRequest) {
      return {
        ackedOpIds: request.ops.map((operation) => operation.opId),
        conflicts: [],
        serverTime: new Date("2026-03-04T12:00:00.000Z"),
      };
    },
    async pull(_request: SyncPullRequest) {
      return {
        nextCursor: options.nextCursor ?? options.cursor ?? "0",
        changes: options.pulledChanges ?? [],
      };
    },
  };

  const dependencies: FinanzasSyncSurfaceDependencies = {
    outbox,
    api,
    syncState: new InMemorySyncStateRepository(options.cursor ?? null),
    changeApplier: {
      async apply(_changes: SyncChange[]) {},
    },
    deviceId: "web-device-1",
  };

  await seedOutbox(outbox, options.outboxSeed ?? []);

  return dependencies;
};

const seedOutbox = async (
  outbox: InMemoryOutboxRepository,
  operations: OutboxOp[],
): Promise<void> => {
  for (const operation of operations) {
    await outbox.append(operation);
  }
};

const createOutboxOperation = (input: {
  opId: string;
  status: OutboxOp["status"];
  lastError?: string;
}): OutboxOp => ({
  opId: input.opId,
  deviceId: "web-device-1",
  entityType: "transaction",
  entityId: `entity-${input.opId}`,
  opType: "create",
  payload: {
    id: `entity-${input.opId}`,
  },
  createdAt: new Date("2026-03-04T10:00:00.000Z"),
  status: input.status,
  attemptCount: input.status === "pending" ? 0 : 1,
  ...(input.lastError !== undefined ? { lastError: input.lastError } : {}),
});
