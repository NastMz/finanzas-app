import type { Category } from "@finanzas/domain";

/**
 * Serializes a category aggregate into the JSON payload format expected
 * by outbox sync operations.
 */
export const toCategoryOutboxPayload = (
  category: Category,
): Record<string, unknown> => ({
  id: category.id,
  name: category.name,
  type: category.type,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
  deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
});
