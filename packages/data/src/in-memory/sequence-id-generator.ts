import type { IdGenerator } from "@finanzas/application";

/**
 * Deterministic id generator that consumes a predefined sequence.
 */
export class SequenceIdGenerator implements IdGenerator {
  private readonly pendingIds: string[];

  constructor(ids: string[]) {
    this.pendingIds = [...ids];
  }

  nextId(): string {
    const nextId = this.pendingIds.shift();

    if (!nextId) {
      throw new Error("SequenceIdGenerator has no more ids available.");
    }

    return nextId;
  }
}
