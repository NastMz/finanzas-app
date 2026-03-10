import type { IdGenerator, IdPurpose } from "@finanzas/application";

const DEFAULT_PREFIX_BY_PURPOSE: Record<IdPurpose, string> = {
  account: "acc",
  category: "cat",
  budget: "bdg",
  "transaction-template": "tpl",
  "recurring-rule": "rrl",
  transaction: "tx",
  "outbox-op": "op",
};

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Optional overrides for ULID id generation.
 */
export interface CreateUlidIdGeneratorOptions {
  namespace?: string;
  prefixByPurpose?: Partial<Record<IdPurpose, string>>;
  clockMillis?: () => number;
  randomValues?: (target: Uint8Array) => Uint8Array;
}

/**
 * Creates a production-grade id generator using ULID payloads.
 */
export const createUlidIdGenerator = (
  options: CreateUlidIdGeneratorOptions = {},
): IdGenerator => {
  const namespace = normalizeSegment(options.namespace ?? "id");
  const prefixByPurpose = {
    ...DEFAULT_PREFIX_BY_PURPOSE,
    ...(options.prefixByPurpose ?? {}),
  };
  const clockMillis = options.clockMillis ?? Date.now;
  const randomValues = options.randomValues ?? defaultRandomValues;

  return {
    nextId: (purpose = "outbox-op"): string => {
      const prefix = normalizeSegment(prefixByPurpose[purpose]);
      const ulid = createUlid(clockMillis, randomValues);
      return `${prefix}-${namespace}-${ulid}`;
    },
  };
};

const createUlid = (
  clockMillis: () => number,
  randomValues: (target: Uint8Array) => Uint8Array,
): string => {
  const timestamp = Math.floor(clockMillis());

  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error("ULID timestamp must be a non-negative finite number.");
  }

  const randomBytes = randomValues(new Uint8Array(10));

  if (randomBytes.length !== 10) {
    throw new Error("ULID randomValues must provide exactly 10 bytes.");
  }

  return `${encodeTimestamp(timestamp)}${encodeRandom(randomBytes)}`;
};

const encodeTimestamp = (timestamp: number): string => {
  let value = BigInt(timestamp);
  const encoded = new Array<string>(10);

  for (let index = 9; index >= 0; index -= 1) {
    const characterIndex = Number(value % 32n);
    const character = CROCKFORD_BASE32[characterIndex];

    if (!character) {
      throw new Error("Failed to encode ULID timestamp.");
    }

    encoded[index] = character;
    value /= 32n;
  }

  return encoded.join("");
};

const encodeRandom = (bytes: Uint8Array): string => {
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  const encoded = new Array<string>(16);

  for (let index = 15; index >= 0; index -= 1) {
    const characterIndex = Number(value % 32n);
    const character = CROCKFORD_BASE32[characterIndex];

    if (!character) {
      throw new Error("Failed to encode ULID random payload.");
    }

    encoded[index] = character;
    value /= 32n;
  }

  return encoded.join("");
};

const defaultRandomValues = (target: Uint8Array): Uint8Array => {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi) {
    throw new Error("Crypto API is required for ULID generation.");
  }

  return cryptoApi.getRandomValues(target);
};

const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
