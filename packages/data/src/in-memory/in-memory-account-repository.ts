import type { Account } from "@finanzas/domain";
import type { AccountRepository } from "@finanzas/application";

/**
 * In-memory implementation of `AccountRepository` for tests and local wiring.
 */
export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>();

  constructor(seed: Account[] = []) {
    for (const account of seed) {
      this.accounts.set(account.id, cloneAccount(account));
    }
  }

  async findById(id: string): Promise<Account | null> {
    const account = this.accounts.get(id);
    return account ? cloneAccount(account) : null;
  }

  async listAll(): Promise<Account[]> {
    return [...this.accounts.values()].map(cloneAccount);
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.id, cloneAccount(account));
  }
}

const cloneAccount = (account: Account): Account => ({
  ...account,
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt),
  deletedAt: account.deletedAt ? new Date(account.deletedAt) : null,
});
