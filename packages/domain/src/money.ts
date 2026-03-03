import { DomainError } from "./errors.js";

const CURRENCY_REGEX = /^[A-Z]{3}$/;

export type CurrencyCode = string;

export interface Money {
  amountMinor: bigint;
  currency: CurrencyCode;
}

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
