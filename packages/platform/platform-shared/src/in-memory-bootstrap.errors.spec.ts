import { ApplicationError } from "@finanzas/application";
import { DomainError } from "@finanzas/domain";
import { describe, expect, it } from "vitest";

import {
  createBootstrap,
  createTestTransactionDate,
  createTransactionInputFixture,
} from "./in-memory-bootstrap.test-helpers.js";

describe("createInMemoryBootstrap", () => {
  it("fails when deleting a missing transaction", async () => {
    const app = createBootstrap();

    await expect(
      app.deleteTransaction({
        transactionId: "tx-missing",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updating a transaction that is already deleted", async () => {
    const app = createBootstrap();
    const transactionDate = createTestTransactionDate();

    const created = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -50000,
        date: transactionDate,
      }),
    );

    await app.deleteTransaction({
      transactionId: created.transaction.id,
    });

    await expect(
      app.updateTransaction({
        transactionId: created.transaction.id,
        note: "intento de editar",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("fails when updating transaction with invalid currency", async () => {
    const app = createBootstrap();
    const transactionDate = createTestTransactionDate();

    const created = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -100000,
        date: transactionDate,
      }),
    );

    await expect(
      app.updateTransaction({
        transactionId: created.transaction.id,
        currency: "USD",
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("fails when listing transactions for unknown account", async () => {
    const app = createBootstrap();

    await expect(
      app.listTransactions({
        accountId: "acc-missing",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
