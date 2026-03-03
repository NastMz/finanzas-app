import { describe, expect, it } from "vitest";

import { createSequenceIdGenerator } from "./create-sequence-id-generator.js";

describe("createSequenceIdGenerator", () => {
  it("generates ids scoped by purpose with independent sequences", () => {
    const ids = createSequenceIdGenerator({
      namespace: "web-local-device",
    });

    expect(ids.nextId("account")).toBe("acc-web-local-device-1");
    expect(ids.nextId("account")).toBe("acc-web-local-device-2");
    expect(ids.nextId("transaction")).toBe("tx-web-local-device-1");
    expect(ids.nextId("category")).toBe("cat-web-local-device-1");
    expect(ids.nextId("outbox-op")).toBe("op-web-local-device-1");
  });

  it("defaults to outbox-op purpose when omitted", () => {
    const ids = createSequenceIdGenerator({
      namespace: "web",
    });

    expect(ids.nextId()).toBe("op-web-1");
    expect(ids.nextId()).toBe("op-web-2");
  });

  it("normalizes namespace and allows custom prefixes", () => {
    const ids = createSequenceIdGenerator({
      namespace: " Device Principal ",
      prefixByPurpose: {
        transaction: "trx",
      },
    });

    expect(ids.nextId("transaction")).toBe("trx-device-principal-1");
    expect(ids.nextId("account")).toBe("acc-device-principal-1");
  });
});
