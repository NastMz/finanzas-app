import type { Transaction } from "@finanzas/domain";

/**
 * Serializes a transaction aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toTransactionOutboxPayload = (
  transaction: Transaction,
): Record<string, unknown> => ({
  id: transaction.id,
  accountId: transaction.accountId,
  amountMinor: transaction.amount.amountMinor.toString(),
  currency: transaction.amount.currency,
  date: transaction.date.toISOString(),
  categoryId: transaction.categoryId,
  note: transaction.note,
  tags: transaction.tags,
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
  deletedAt: transaction.deletedAt ? transaction.deletedAt.toISOString() : null,
});
