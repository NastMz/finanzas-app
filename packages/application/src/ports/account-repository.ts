import type { Account } from "@finanzas/domain";

/**
 * Port for account persistence operations required by application use cases.
 */
export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  listAll(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  replaceAll(accounts: Account[]): Promise<void>;
}
