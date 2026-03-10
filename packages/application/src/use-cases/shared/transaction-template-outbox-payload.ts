import type { TransactionTemplate } from "@finanzas/domain";

/**
 * Serializes a transaction template aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toTransactionTemplateOutboxPayload = (
  template: TransactionTemplate,
): Record<string, unknown> => ({
  id: template.id,
  name: template.name,
  accountId: template.accountId,
  amountMinor: template.amount.amountMinor.toString(),
  currency: template.amount.currency,
  categoryId: template.categoryId,
  note: template.note,
  tags: template.tags,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
  deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
});
