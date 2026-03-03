import { DomainError } from "./errors.js";

const CURRENCY_REGEX = /^[A-Z]{3}$/;

/**
 * ISO-4217 currency code (for example `COP`, `USD`).
 */
export type CurrencyCode = string;

/**
 * Monetary value represented in minor units to avoid floating-point issues.
 */
export interface Money {
  amountMinor: bigint;
  currency: CurrencyCode;
}

/**
 * Creates a validated `Money` value object.
 */
export const createMoney = (amountMinor: number | bigint, currency: string): Money => {
  const normalizedAmount = normalizeAmount(amountMinor);

  if (normalizedAmount === 0n) {
    throw new DomainError("Amount cannot be zero.");
  }

  return {
    amountMinor: normalizedAmount,
    currency: normalizeCurrency(currency),
  };
};

/**
 * Normalizes and validates an ISO-4217 currency code.
 */
export const normalizeCurrency = (currency: string): CurrencyCode => {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (!CURRENCY_REGEX.test(normalizedCurrency)) {
    throw new DomainError("Currency must follow ISO-4217 format.");
  }

  return normalizedCurrency;
};

const normalizeAmount = (amountMinor: number | bigint): bigint => {
  if (typeof amountMinor === "number") {
    if (!Number.isInteger(amountMinor)) {
      throw new DomainError("Amount in minor units must be an integer.");
    }

    return BigInt(amountMinor);
  }

  return amountMinor;
};
