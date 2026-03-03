import type { IdGenerator } from "@finanzas/application";

/**
 * Creates a simple incremental id generator with a configurable prefix.
 */
export const createSequenceIdGenerator = (prefix = "web-"): IdGenerator => {
  let sequence = 1;

  return {
    nextId: (): string => {
      const id = `${prefix}${sequence}`;
      sequence += 1;
      return id;
    },
  };
};
