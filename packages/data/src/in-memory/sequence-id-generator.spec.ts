import { describe, expect, it } from "vitest";

import { SequenceIdGenerator } from "./sequence-id-generator.js";

describe("SequenceIdGenerator", () => {
  it("returns queued ids when entries are plain strings", () => {
    const ids = new SequenceIdGenerator(["acc-1", "op-1"]);

    expect(ids.nextId("account")).toBe("acc-1");
    expect(ids.nextId("outbox-op")).toBe("op-1");
  });

  it("validates typed entry purpose when provided", () => {
    const ids = new SequenceIdGenerator([
      {
        id: "acc-1",
        purpose: "account",
      },
    ]);

    expect(() => ids.nextId("transaction")).toThrow(
      "SequenceIdGenerator expected purpose 'account' but got 'transaction'.",
    );
  });
});
