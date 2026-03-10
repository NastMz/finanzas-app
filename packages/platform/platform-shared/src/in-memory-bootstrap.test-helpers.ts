import type {
  AddAccountInput,
  AddTransactionInput,
  IdGenerator,
} from "@finanzas/application";
import type { SyncApiClient } from "@finanzas/sync";

import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "./in-memory-bootstrap.js";

export interface BootstrapCreationOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

export const ULID_PATTERN = "[0-9A-HJKMNP-TV-Z]{26}";

export const createBootstrap = (
  options: BootstrapCreationOptions = {},
): InMemoryBootstrap =>
  createInMemoryBootstrap({
    defaultDeviceId: "platform-local-device",
    ...options,
  });

export const createTestTransactionDate = (): Date =>
  new Date("2026-03-02T10:00:00.000Z");

export const createTestSyncServerTime = (): Date =>
  new Date("2026-03-02T10:30:00.000Z");

export const createAccountInputFixture = (
  overrides: Partial<AddAccountInput> = {},
): AddAccountInput => ({
  name: "Cuenta pruebas",
  type: "cash",
  currency: "COP",
  ...overrides,
});

export const createTransactionInputFixture = (
  overrides: Partial<AddTransactionInput> = {},
): AddTransactionInput => ({
  accountId: "acc-main",
  amountMinor: -120000,
  currency: "COP",
  date: createTestTransactionDate(),
  categoryId: "food",
  ...overrides,
});

export const createFailingPushSyncApiClient = (
  errorMessage = "Network unavailable",
): SyncApiClient => ({
  async push() {
    throw new Error(errorMessage);
  },
  async pull() {
    return {
      nextCursor: "0",
      changes: [],
    };
  },
});

export const createPartialAckSyncApiClient = (): SyncApiClient => ({
  async push(request) {
    return {
      ackedOpIds: request.ops.slice(0, 1).map((operation) => operation.opId),
      conflicts: [],
      serverTime: createTestSyncServerTime(),
    };
  },
  async pull() {
    return {
      nextCursor: "0",
      changes: [],
    };
  },
});

export const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
