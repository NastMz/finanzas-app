import type {
  AddAccountInput,
  AddTransactionInput,
  IdGenerator,
} from "@finanzas/application";
import { ApplicationError } from "@finanzas/application";
import { SequenceIdGenerator } from "@finanzas/data";
import { DomainError } from "@finanzas/domain";
import { SyncError, type SyncApiClient } from "@finanzas/sync";
import { describe, expect, it } from "vitest";

import {
  createInMemoryBootstrap,
  type InMemoryBootstrap,
} from "./in-memory-bootstrap.js";

interface BootstrapCreationOptions {
  syncApi?: SyncApiClient;
  deviceId?: string;
  ids?: IdGenerator;
}

const ULID_PATTERN = "[0-9A-HJKMNP-TV-Z]{26}";

const createBootstrap = (
  options: BootstrapCreationOptions = {},
): InMemoryBootstrap =>
  createInMemoryBootstrap({
    defaultDeviceId: "platform-local-device",
    ...options,
  });

describe("createInMemoryBootstrap", () => {
  it("uses ULID strategy by default for generated ids", async () => {
    const ulidDeviceId = "Platform Device 01";
    const app = createBootstrap({
      deviceId: ulidDeviceId,
    });
    const normalizedDeviceId = normalizeSegment(ulidDeviceId);

    const accountResult = await app.addAccount(createAccountInputFixture());

    expect(accountResult.account.id).toMatch(
      new RegExp(`^acc-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(accountResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );

    const transactionResult = await app.addTransaction(
      createTransactionInputFixture({
        accountId: accountResult.account.id,
        amountMinor: -35000,
        date: new Date("2026-03-03T10:00:00.000Z"),
        categoryId: "misc",
      }),
    );

    expect(transactionResult.transaction.id).toMatch(
      new RegExp(`^tx-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(transactionResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
  });

  it("supports deterministic ids when injected", async () => {
    const deterministicDeviceId = "platform-test-device";
    const normalizedDeviceId = normalizeSegment(deterministicDeviceId);
    const deterministicIds = new SequenceIdGenerator([
      {
        id: `acc-${normalizedDeviceId}-1`,
        purpose: "account",
      },
      {
        id: `op-${normalizedDeviceId}-1`,
        purpose: "outbox-op",
      },
      {
        id: `tx-${normalizedDeviceId}-1`,
        purpose: "transaction",
      },
      {
        id: `op-${normalizedDeviceId}-2`,
        purpose: "outbox-op",
      },
    ]);
    const app = createBootstrap({
      ids: deterministicIds,
      deviceId: deterministicDeviceId,
    });

    const accountResult = await app.addAccount(
      createAccountInputFixture({
        name: "Cuenta deterministica",
        type: "bank",
      }),
    );
    expect(accountResult.account.id).toBe(`acc-${normalizedDeviceId}-1`);
    expect(accountResult.outboxOpId).toBe(`op-${normalizedDeviceId}-1`);

    const transactionResult = await app.addTransaction(
      createTransactionInputFixture({
        accountId: accountResult.account.id,
        amountMinor: -12000,
        date: new Date("2026-03-03T10:00:00.000Z"),
        categoryId: "misc",
      }),
    );
    expect(transactionResult.transaction.id).toBe(`tx-${normalizedDeviceId}-1`);
    expect(transactionResult.outboxOpId).toBe(`op-${normalizedDeviceId}-2`);
  });

  it("manages budget lifecycle through shared bootstrap wiring", async () => {
    const app = createBootstrap();
    const categoryResult = await app.addCategory({
      name: "Comida",
      type: "expense",
    });

    const created = await app.addBudget({
      categoryId: categoryResult.category.id,
      period: "2026-03",
      limitAmountMinor: 400000,
      currency: "COP",
    });

    const updated = await app.updateBudget({
      budgetId: created.budget.id,
      limitAmountMinor: 450000,
    });

    const activeBudgets = await app.listBudgets({
      period: "2026-03",
    });
    expect(activeBudgets.budgets.map((budget) => budget.id)).toEqual([
      created.budget.id,
    ]);
    expect(activeBudgets.budgets[0]?.limit.amountMinor).toBe(450000n);

    await app.deleteBudget({
      budgetId: created.budget.id,
    });

    const budgetsWithTombstones = await app.listBudgets({
      includeDeleted: true,
      period: "2026-03",
    });
    expect(budgetsWithTombstones.budgets).toHaveLength(1);
    expect(budgetsWithTombstones.budgets[0]?.deletedAt).not.toBeNull();
    expect(updated.budget.limit.amountMinor).toBe(450000n);
  });

  it("runs recurring rules through shared bootstrap wiring", async () => {
    const app = createBootstrap();

    const templateResult = await app.addTransactionTemplate({
      name: "Arriendo",
      accountId: "acc-main",
      amountMinor: -900000,
      currency: "COP",
      categoryId: "home",
    });

    await app.addRecurringRule({
      templateId: templateResult.template.id,
      schedule: {
        frequency: "monthly",
        interval: 1,
        dayOfMonth: 5,
      },
      startsOn: new Date("2026-01-01T00:00:00.000Z"),
    });

    const runResult = await app.runRecurringRules({
      asOf: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(runResult.generatedTransactions).toHaveLength(3);

    const recurringRules = await app.listRecurringRules();
    expect(recurringRules.recurringRules).toHaveLength(1);
    expect(recurringRules.recurringRules[0]?.nextRunOn.toISOString()).toBe(
      "2026-04-05T00:00:00.000Z",
    );
  });

  it("marks operations as failed when sync push throws", async () => {
    const app = createBootstrap({
      syncApi: createFailingPushSyncApiClient(),
    });

    await app.addTransaction(createTransactionInputFixture());

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);

    const retrySync = await app.syncNow();
    expect(retrySync.pushedOpIds).toEqual([]);
    expect(retrySync.ackedOpIds).toEqual([]);
    expect(retrySync.failedOpIds).toEqual([]);
    expect(retrySync.nextCursor).toBe("0");
  });

  it("runs full transaction lifecycle and syncs changes", async () => {
    const app = createBootstrap();
    const transactionDate = createTestTransactionDate();

    const created = await app.addTransaction(
      createTransactionInputFixture({
        date: transactionDate,
        note: "almuerzo",
        tags: ["Food"],
      }),
    );

    const updated = await app.updateTransaction({
      transactionId: created.transaction.id,
      amountMinor: -145000,
      note: "almuerzo y cafe",
      tags: ["Food", "Cafe", "food"],
    });

    const deleted = await app.deleteTransaction({
      transactionId: created.transaction.id,
    });

    const firstSync = await app.syncNow();

    expect(firstSync.pushedOpIds).toEqual([
      created.outboxOpId,
      updated.outboxOpId,
      deleted.outboxOpId,
    ]);
    expect(firstSync.ackedOpIds).toEqual(firstSync.pushedOpIds);
    expect(firstSync.failedOpIds).toEqual([]);
    expect(firstSync.pulledChanges).toBe(3);
    expect(firstSync.nextCursor).toBe("3");

    const activeTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(activeTransactions.transactions).toHaveLength(0);

    const allTransactions = await app.listTransactions({
      accountId: "acc-main",
      includeDeleted: true,
    });
    expect(allTransactions.transactions).toHaveLength(1);
    expect(allTransactions.transactions[0]?.id).toBe(created.transaction.id);
    expect(allTransactions.transactions[0]?.amount.amountMinor).toBe(-145000n);
    expect(allTransactions.transactions[0]?.note).toBe("almuerzo y cafe");
    expect(allTransactions.transactions[0]?.tags).toEqual(["food", "cafe"]);
    expect(allTransactions.transactions[0]?.deletedAt).not.toBeNull();

    const secondSync = await app.syncNow();
    expect(secondSync.pushedOpIds).toEqual([]);
    expect(secondSync.ackedOpIds).toEqual([]);
    expect(secondSync.failedOpIds).toEqual([]);
    expect(secondSync.pulledChanges).toBe(0);
    expect(secondSync.nextCursor).toBe("3");
  });

  it("supports bulk transaction quick actions through shared bootstrap wiring", async () => {
    const app = createBootstrap();
    const first = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );
    const second = await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -50000,
        categoryId: "transport",
        date: new Date("2026-03-04T10:00:00.000Z"),
      }),
    );

    await app.bulkUpdateTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
      categoryId: "misc",
      tags: ["Quick", "Review"],
    });

    const updatedTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(updatedTransactions.transactions.map((transaction) => transaction.categoryId)).toEqual([
      "misc",
      "misc",
    ]);
    expect(updatedTransactions.transactions[0]?.tags).toEqual(["quick", "review"]);

    await app.bulkDeleteTransactions({
      transactionIds: [first.transaction.id, second.transaction.id],
    });

    const activeTransactions = await app.listTransactions({
      accountId: "acc-main",
    });
    expect(activeTransactions.transactions).toHaveLength(0);

    const allTransactions = await app.listTransactions({
      accountId: "acc-main",
      includeDeleted: true,
    });
    expect(allTransactions.transactions).toHaveLength(2);
    expect(allTransactions.transactions.every((transaction) => transaction.deletedAt !== null)).toBe(
      true,
    );
  });

  it("reports failed operations when server ack is partial", async () => {
    const app = createBootstrap({
      syncApi: createPartialAckSyncApiClient(),
    });

    const created = await app.addTransaction(createTransactionInputFixture());

    const updated = await app.updateTransaction({
      transactionId: created.transaction.id,
      note: "editado",
    });

    const syncResult = await app.syncNow();
    expect(syncResult.pushedOpIds).toEqual([created.outboxOpId, updated.outboxOpId]);
    expect(syncResult.ackedOpIds).toEqual([created.outboxOpId]);
    expect(syncResult.failedOpIds).toEqual([updated.outboxOpId]);

    const nextSync = await app.syncNow();
    expect(nextSync.pushedOpIds).toEqual([]);
    expect(nextSync.ackedOpIds).toEqual([]);
    expect(nextSync.failedOpIds).toEqual([]);
    expect(nextSync.nextCursor).toBe("0");
  });

  it("lists accounts and categories using shared bootstrap wiring", async () => {
    const app = createBootstrap();

    const initialAccounts = await app.listAccounts();
    expect(initialAccounts.accounts.map((account) => account.id)).toEqual([
      "acc-main",
    ]);

    const categoryResult = await app.addCategory({
      name: "Comida",
      type: "expense",
    });

    const activeCategories = await app.listCategories();
    expect(activeCategories.categories.map((category) => category.id)).toEqual([
      categoryResult.category.id,
    ]);

    await app.deleteCategory({
      categoryId: categoryResult.category.id,
    });

    const categoriesWithTombstones = await app.listCategories({
      includeDeleted: true,
    });
    expect(
      categoriesWithTombstones.categories.map((category) => category.id),
    ).toEqual([categoryResult.category.id]);
  });

  it("exposes account summary query for the home slice", async () => {
    const app = createBootstrap();

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: 300000,
        categoryId: "income",
        date: new Date("2026-03-02T10:00:00.000Z"),
      }),
    );

    await app.addTransaction(
      createTransactionInputFixture({
        amountMinor: -50000,
        categoryId: "transport",
        date: new Date("2026-03-03T12:00:00.000Z"),
      }),
    );

    const summary = await app.getAccountSummary({
      accountId: "acc-main",
      from: new Date("2026-03-01T00:00:00.000Z"),
      to: new Date("2026-03-31T23:59:59.999Z"),
      recentLimit: 2,
      topCategoriesLimit: 2,
    });

    expect(summary.transactionCount).toBe(3);
    expect(summary.totals).toEqual({
      incomeMinor: 300000n,
      expenseMinor: 170000n,
      netMinor: 130000n,
    });
    expect(summary.topExpenseCategories).toEqual([
      {
        categoryId: "food",
        expenseMinor: 120000n,
      },
      {
        categoryId: "transport",
        expenseMinor: 50000n,
      },
    ]);
    expect(summary.recentTransactions.map((transaction) => transaction.categoryId)).toEqual([
      "transport",
      "food",
    ]);
  });

  it("exports and imports business data while resetting local sync state", async () => {
    const source = createBootstrap();
    await source.addCategory({
      name: "Comida",
      type: "expense",
    });
    await source.addTransaction(
      createTransactionInputFixture({
        amountMinor: -120000,
        categoryId: "food",
        date: new Date("2026-03-03T10:00:00.000Z"),
      }),
    );

    const exported = await source.exportData();

    const target = createBootstrap();
    await target.addAccount({
      name: "Cuenta local",
      type: "cash",
      currency: "COP",
    });
    await target.addTransaction(createTransactionInputFixture());

    const pendingBeforeImport = await target.getSyncStatus();
    expect(pendingBeforeImport.counts.pending).toBeGreaterThan(0);

    await target.importData({
      bundle: exported.bundle,
    });

    const accounts = await target.listAccounts();
    expect(accounts.accounts.map((account) => account.id)).toEqual(["acc-main"]);

    const transactions = await target.listTransactions({
      accountId: "acc-main",
    });
    expect(transactions.transactions).toHaveLength(1);
    expect(transactions.transactions[0]?.amount.amountMinor).toBe(-120000n);

    const syncStatus = await target.getSyncStatus();
    expect(syncStatus.status).toBe("synced");
    expect(syncStatus.counts).toEqual({
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    });
  });

  it("reports sync status for account settings UI", async () => {
    const app = createBootstrap({
      syncApi: createFailingPushSyncApiClient("Offline"),
    });

    const initialStatus = await app.getSyncStatus();
    expect(initialStatus.status).toBe("synced");
    expect(initialStatus.counts).toEqual({
      pending: 0,
      sent: 0,
      failed: 0,
      acked: 0,
    });

    await app.addTransaction(createTransactionInputFixture());

    const pendingStatus = await app.getSyncStatus();
    expect(pendingStatus.status).toBe("pending");
    expect(pendingStatus.counts.pending).toBe(1);

    await expect(app.syncNow()).rejects.toBeInstanceOf(SyncError);

    const errorStatus = await app.getSyncStatus();
    expect(errorStatus.status).toBe("error");
    expect(errorStatus.counts.failed).toBe(1);
    expect(errorStatus.lastError).toContain("Offline");
  });

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

const createTestTransactionDate = (): Date =>
  new Date("2026-03-02T10:00:00.000Z");

const createTestSyncServerTime = (): Date =>
  new Date("2026-03-02T10:30:00.000Z");

const createAccountInputFixture = (
  overrides: Partial<AddAccountInput> = {},
): AddAccountInput => ({
  name: "Cuenta pruebas",
  type: "cash",
  currency: "COP",
  ...overrides,
});

const createTransactionInputFixture = (
  overrides: Partial<AddTransactionInput> = {},
): AddTransactionInput => ({
  accountId: "acc-main",
  amountMinor: -120000,
  currency: "COP",
  date: createTestTransactionDate(),
  categoryId: "food",
  ...overrides,
});

const createFailingPushSyncApiClient = (
  errorMessage = "Network unavailable",
): SyncApiClient => ({
  async push() {
    throw new Error(errorMessage);
  },
  async pull() {
    return {
      nextCursor: "0",
      changes: [],
    };
  },
});

const createPartialAckSyncApiClient = (): SyncApiClient => ({
  async push(request) {
    return {
      ackedOpIds: request.ops.slice(0, 1).map((operation) => operation.opId),
      conflicts: [],
      serverTime: createTestSyncServerTime(),
    };
  },
  async pull() {
    return {
      nextCursor: "0",
      changes: [],
    };
  },
});

const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
