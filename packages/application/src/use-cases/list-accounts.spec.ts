import { describe, expect, it } from "vitest";

import { createAccount } from "@finanzas/domain";
import { InMemoryAccountRepository } from "@finanzas/data";

import { listAccounts } from "./list-accounts.js";

describe("listAccounts", () => {
  it("lists local accounts excluding tombstones by default", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const accountB = createAccount({
      id: "acc-b",
      name: "Beta",
      type: "cash",
      currency: "COP",
      createdAt: now,
    });

    const accountA = createAccount({
      id: "acc-a",
      name: "Alpha",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const deletedAccount = {
      ...createAccount({
        id: "acc-deleted",
        name: "Deleted",
        type: "credit",
        currency: "COP",
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listAccounts(
      {
        accounts: new InMemoryAccountRepository([
          accountB,
          deletedAccount,
          accountA,
        ]),
      },
      {},
    );

    expect(result.accounts.map((account) => account.id)).toEqual([
      "acc-a",
      "acc-b",
    ]);
  });

  it("includes tombstones when requested and supports limit", async () => {
    const now = new Date("2026-03-03T10:00:00.000Z");

    const accountA = createAccount({
      id: "acc-a",
      name: "Alpha",
      type: "bank",
      currency: "COP",
      createdAt: now,
    });

    const accountB = createAccount({
      id: "acc-b",
      name: "Beta",
      type: "cash",
      currency: "COP",
      createdAt: now,
    });

    const deletedAccount = {
      ...createAccount({
        id: "acc-deleted",
        name: "Deleted",
        type: "credit",
        currency: "COP",
        createdAt: now,
      }),
      updatedAt: now,
      deletedAt: now,
    };

    const result = await listAccounts(
      {
        accounts: new InMemoryAccountRepository([
          accountB,
          accountA,
          deletedAccount,
        ]),
      },
      {
        includeDeleted: true,
        limit: 2,
      },
    );

    expect(result.accounts.map((account) => account.id)).toEqual([
      "acc-a",
      "acc-b",
    ]);
  });

  it("returns empty list when no accounts exist", async () => {
    const result = await listAccounts(
      {
        accounts: new InMemoryAccountRepository(),
      },
      {},
    );

    expect(result.accounts).toEqual([]);
  });
});
