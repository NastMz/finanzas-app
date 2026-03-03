import type { Account } from "@finanzas/domain";
import type { AccountRepository } from "@finanzas/application";

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
