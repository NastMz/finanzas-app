import { type Account } from "./account.js";
import { DomainError } from "./errors.js";
import { type Money } from "./money.js";

export interface Transaction {
  id: string;
  accountId: string;
  amount: Money;
  date: Date;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface CreateTransactionInput {
  id: string;
  accountId: string;
  amount: Money;
  date: Date;
  categoryId: string;
  note?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export const createTransaction = (
  input: CreateTransactionInput,
  account: Account,
): Transaction => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Transaction id is required.");
  }

  if (input.accountId !== account.id) {
    throw new DomainError("Transaction account does not match existing account.");
  }

  if (input.amount.amountMinor === 0n) {
    throw new DomainError("Transaction amount cannot be zero.");
  }

  if (input.amount.currency !== account.currency) {
    throw new DomainError("Transaction currency must match account currency.");
  }

  if (input.categoryId.trim().length === 0) {
    throw new DomainError("Category id is required.");
  }

  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError("Transaction updatedAt cannot be before createdAt.");
  }

  return {
    id: input.id,
    accountId: input.accountId,
    amount: input.amount,
    date: input.date,
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
