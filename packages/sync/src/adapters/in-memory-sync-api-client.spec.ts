import { describe, expect, it } from "vitest";

import { createInMemorySyncApiClient } from "./in-memory-sync-api-client.js";

describe("createInMemorySyncApiClient", () => {
  it("stores pushed operations and returns them on incremental pull", async () => {
    const now = new Date("2026-03-03T15:00:00.000Z");
    const api = createInMemorySyncApiClient({
      now: () => now,
    });

    const pushResponse = await api.push({
      deviceId: "device-1",
      ops: [
        {
          opId: "op-1",
          deviceId: "device-1",
          entityType: "transaction",
          entityId: "tx-1",
          opType: "create",
          payload: {
            id: "tx-1",
          },
          createdAt: now,
          status: "pending",
          attemptCount: 0,
        },
      ],
    });

    expect(pushResponse.ackedOpIds).toEqual(["op-1"]);

    const firstPull = await api.pull({
      deviceId: "device-1",
      cursor: "0",
    });

    expect(firstPull.nextCursor).toBe("1");
    expect(firstPull.changes).toHaveLength(1);
    expect(firstPull.changes[0]?.entityId).toBe("tx-1");

    const secondPull = await api.pull({
      deviceId: "device-1",
      cursor: "1",
    });

    expect(secondPull.nextCursor).toBe("1");
    expect(secondPull.changes).toEqual([]);
  });
});
