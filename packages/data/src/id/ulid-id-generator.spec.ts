import { describe, expect, it } from "vitest";

import { createUlidIdGenerator } from "./ulid-id-generator.js";

describe("createUlidIdGenerator", () => {
  it("generates ids with purpose prefix, namespace and ULID payload", () => {
    const ids = createUlidIdGenerator({
      namespace: "Device 01",
      clockMillis: () => 1_772_518_400_000,
      randomValues: (target) => {
        target.fill(17);
        return target;
      },
    });

    const transactionId = ids.nextId("transaction");
    expect(transactionId.startsWith("tx-device-01-")).toBe(true);

    const ulidPayload = transactionId.slice("tx-device-01-".length);
    expect(ulidPayload).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("defaults to outbox-op when purpose is omitted", () => {
    const ids = createUlidIdGenerator({
      namespace: "web",
      clockMillis: () => 1_772_518_400_000,
      randomValues: (target) => {
        target.fill(1);
        return target;
      },
    });

    expect(ids.nextId()).toMatch(/^op-web-[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});
