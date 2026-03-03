import type { Account } from "@finanzas/domain";

/**
 * Serializes an account aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toAccountOutboxPayload = (account: Account): Record<string, unknown> => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
  deletedAt: account.deletedAt ? account.deletedAt.toISOString() : null,
});
