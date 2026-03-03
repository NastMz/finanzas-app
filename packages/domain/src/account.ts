import { DomainError } from "./errors.js";
import { normalizeCurrency, type CurrencyCode } from "./money.js";

export type AccountType = "cash" | "bank" | "credit";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}

export interface CreateAccountInput {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: Date;
  updatedAt?: Date;
}

export const createAccount = (input: CreateAccountInput): Account => {
  if (input.id.trim().length === 0) {
    throw new DomainError("Account id is required.");
  }

  if (input.name.trim().length === 0) {
    throw new DomainError("Account name is required.");
  }

  const updatedAt = input.updatedAt ?? input.createdAt;

  if (updatedAt < input.createdAt) {
    throw new DomainError("Account updatedAt cannot be before createdAt.");
  }

  return {
    id: input.id,
    name: input.name.trim(),
    type: input.type,
    currency: normalizeCurrency(input.currency),
    createdAt: input.createdAt,
    updatedAt,
    deletedAt: null,
    version: null,
  };
};
