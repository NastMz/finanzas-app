import type { AccountType } from "@finanzas/domain";

export interface ImportedAccountSnapshot {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
