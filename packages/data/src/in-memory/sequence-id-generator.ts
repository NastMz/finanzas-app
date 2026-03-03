import type { IdGenerator, IdPurpose } from "@finanzas/application";

/**
 * Optional typed entry for deterministic id sequences.
 */
export interface SequenceIdEntry {
  id: string;
  purpose?: IdPurpose;
}

/**
 * Deterministic id generator that consumes a predefined sequence.
 */
export class SequenceIdGenerator implements IdGenerator {
  private readonly pendingIds: Array<string | SequenceIdEntry>;

  constructor(ids: Array<string | SequenceIdEntry>) {
    this.pendingIds = [...ids];
  }

  nextId(purpose?: IdPurpose): string {
    const nextId = this.pendingIds.shift();

    if (!nextId) {
      throw new Error("SequenceIdGenerator has no more ids available.");
    }

    if (typeof nextId === "string") {
      return nextId;
    }

    if (nextId.purpose && purpose && nextId.purpose !== purpose) {
      throw new Error(
        `SequenceIdGenerator expected purpose '${nextId.purpose}' but got '${purpose}'.`,
      );
    }

    return nextId.id;
  }
}
