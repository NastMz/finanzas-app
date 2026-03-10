import { type Account } from "./account.js";
import { DomainError } from "./errors.js";
import { type Money } from "./money.js";

/**
 * Transaction template aggregate root.
 */
export interface TransactionTemplate {
  id: string;
  name: string;
  accountId: string;
  amount: Money;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

/**
 * Input required to create a valid `TransactionTemplate`.
 */
export interface CreateTransactionTemplateInput {
  id: string;
  name: string;
  accountId: string;
  amount: Money;
  categoryId: string;
  note?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Creates a validated `TransactionTemplate` aggregate.
 */
export const createTransactionTemplate = (
  input: CreateTransactionTemplateInput,
  account: Account,
): TransactionTemplate => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Transaction template id is required.");
  }

  if (input.name.trim().length === 0) {
    throw new DomainError("Transaction template name is required.");
  }

  if (input.accountId !== account.id) {
    throw new DomainError(
      "Transaction template account does not match existing account.",
    );
  }

  if (input.amount.amountMinor === 0n) {
    throw new DomainError("Transaction template amount cannot be zero.");
  }

  if (input.amount.currency !== account.currency) {
    throw new DomainError("Transaction template currency must match account currency.");
  }

  if (input.categoryId.trim().length === 0) {
    throw new DomainError("Transaction template category id is required.");
  }

  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError(
      "Transaction template updatedAt cannot be before createdAt.",
    );
  }

  return {
    id: input.id,
    name: input.name.trim(),
    accountId: input.accountId,
    amount: input.amount,
    categoryId: input.categoryId,
    note: normalizeOptionalText(input.note),
    tags: normalizeTags(input.tags),
    createdAt: input.createdAt,
    updatedAt,
    deletedAt: null,
    version: null,
  };
};

const normalizeOptionalText = (value: string | undefined): string | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeTags = (tags: string[] | undefined): string[] => {
  if (!tags) {
    return [];
  }

  const uniqueTags = new Set<string>();

  for (const tag of tags) {
    const normalizedTag = tag.trim().toLowerCase();

    if (normalizedTag.length > 0) {
      uniqueTags.add(normalizedTag);
    }
  }

  return [...uniqueTags];
};
