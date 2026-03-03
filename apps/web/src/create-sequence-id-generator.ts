import type { IdGenerator, IdPurpose } from "@finanzas/application";

const DEFAULT_PREFIX_BY_PURPOSE: Record<IdPurpose, string> = {
  account: "acc",
  category: "cat",
  transaction: "tx",
  "outbox-op": "op",
};

export interface CreateSequenceIdGeneratorOptions {
  namespace?: string;
  prefixByPurpose?: Partial<Record<IdPurpose, string>>;
}

/**
 * Creates a deterministic incremental id generator with independent sequences per
 * purpose, useful for tests and reproducible fixtures.
 */
export const createSequenceIdGenerator = (
  options: CreateSequenceIdGeneratorOptions = {},
): IdGenerator => {
  const namespace = normalizeSegment(options.namespace ?? "web");
  const prefixByPurpose = {
    ...DEFAULT_PREFIX_BY_PURPOSE,
    ...(options.prefixByPurpose ?? {}),
  };
  const sequenceByPurpose: Record<IdPurpose, number> = {
    account: 1,
    category: 1,
    transaction: 1,
    "outbox-op": 1,
  };

  return {
    nextId: (purpose = "outbox-op"): string => {
      const sequence = sequenceByPurpose[purpose];
      sequenceByPurpose[purpose] = sequence + 1;
      const prefix = normalizeSegment(prefixByPurpose[purpose]);
      const id = `${prefix}-${namespace}-${sequence}`;
      return id;
    },
  };
};

const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
