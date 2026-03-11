import type { IdPurpose } from "./id-purpose.js";

/**
 * Identifier generator abstraction for deterministic and platform-specific ids.
 */
export interface IdGenerator {
  nextId(purpose?: IdPurpose): string;
}
