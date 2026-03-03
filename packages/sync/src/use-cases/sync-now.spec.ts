import { describe, expect, it } from "vitest";

import type { OutboxOp } from "@finanzas/application";
import { InMemoryOutboxRepository, InMemorySyncStateRepository } from "@finanzas/data";

import { SyncError } from "../errors.js";
import type {
  SyncApiClient,
  SyncChange,
  SyncPullRequest,
  SyncPushRequest,
} from "../ports.js";
import { syncNow } from "./sync-now.js";

describe("syncNow", () => {
  it("pushes pending outbox operations, marks acked ops and updates cursor", async () => {
    const outbox = new InMemoryOutboxRepository();
    const syncState = new InMemorySyncStateRepository("0");

    const operation = createOutboxOperation({
      opId: "op-1",
      entityId: "tx-1",
    });

    await outbox.append(operation);

    const appliedChanges: SyncChange[] = [];

    const api: SyncApiClient = {
      async push(request: SyncPushRequest) {
        expect(request.deviceId).toBe("web-device-1");
        expect(request.ops).toHaveLength(1);
        return {
          ackedOpIds: ["op-1"],
          conflicts: [],
          serverTime: new Date("2026-03-02T20:00:00.000Z"),
        };
      },
      async pull(request: SyncPullRequest) {
        expect(request.cursor).toBe("0");
        return {
          nextCursor: "1",
          changes: [
            {
              changeId: "chg-1",
              entityType: "transaction",
              entityId: "tx-1",
              opType: "create",
              payload: {
                id: "tx-1",
              },
              serverVersion: 1,
              serverTimestamp: new Date("2026-03-02T20:00:00.000Z"),
            },
          ],
        };
      },
    };

    const result = await syncNow({
      outbox,
      api,
      syncState,
      changeApplier: {
        async apply(changes: SyncChange[]) {
          appliedChanges.push(...changes);
        },
      },
      deviceId: "web-device-1",
    });

    expect(result.pushedOpIds).toEqual(["op-1"]);
    expect(result.ackedOpIds).toEqual(["op-1"]);
    expect(result.failedOpIds).toEqual([]);
    expect(result.pulledChanges).toBe(1);
    expect(result.nextCursor).toBe("1");

    const operations = await outbox.listAll();
    expect(operations[0]?.status).toBe("acked");
    expect(operations[0]?.attemptCount).toBe(1);
    expect(await syncState.getCursor()).toBe("1");
    expect(appliedChanges).toHaveLength(1);
  });

  it("marks operations as failed and throws when push fails", async () => {
    const outbox = new InMemoryOutboxRepository();
    await outbox.append(
      createOutboxOperation({
        opId: "op-1",
        entityId: "tx-1",
      }),
    );

    const api: SyncApiClient = {
      async push(_request: SyncPushRequest) {
        throw new Error("Network unavailable");
      },
      async pull(_request: SyncPullRequest) {
        return {
          nextCursor: "0",
          changes: [],
        };
      },
    };

    await expect(
      syncNow({
        outbox,
        api,
        syncState: new InMemorySyncStateRepository("0"),
        changeApplier: {
          async apply(_changes: SyncChange[]) {},
        },
        deviceId: "web-device-1",
      }),
    ).rejects.toBeInstanceOf(SyncError);

    const operations = await outbox.listAll();
    expect(operations[0]?.status).toBe("failed");
    expect(operations[0]?.attemptCount).toBe(1);
    expect(operations[0]?.lastError).toContain("Network unavailable");
  });

  it("pulls changes even without pending operations", async () => {
    const outbox = new InMemoryOutboxRepository();
    const syncState = new InMemorySyncStateRepository("5");
    let pushCalls = 0;

    const api: SyncApiClient = {
      async push(_request: SyncPushRequest) {
        pushCalls += 1;
        return {
          ackedOpIds: [],
          conflicts: [],
          serverTime: new Date("2026-03-02T20:00:00.000Z"),
        };
      },
      async pull(request: SyncPullRequest) {
        expect(request.cursor).toBe("5");
        return {
          nextCursor: "6",
          changes: [],
        };
      },
    };

    const result = await syncNow({
      outbox,
      api,
      syncState,
      changeApplier: {
        async apply(_changes: SyncChange[]) {},
      },
      deviceId: "web-device-1",
    });

    expect(pushCalls).toBe(0);
    expect(result.pushedOpIds).toEqual([]);
    expect(result.ackedOpIds).toEqual([]);
    expect(result.failedOpIds).toEqual([]);
    expect(result.nextCursor).toBe("6");
    expect(await syncState.getCursor()).toBe("6");
  });
});

const createOutboxOperation = (input: {
  opId: string;
  entityId: string;
}): OutboxOp => ({
  opId: input.opId,
  deviceId: "web-device-1",
  entityType: "transaction",
  entityId: input.entityId,
  opType: "create",
  payload: {
    id: input.entityId,
  },
  createdAt: new Date("2026-03-02T19:00:00.000Z"),
  status: "pending",
  attemptCount: 0,
});
