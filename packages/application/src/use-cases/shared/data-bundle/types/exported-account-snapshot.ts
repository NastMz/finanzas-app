import type { AccountType } from "@finanzas/domain";

export interface ExportedAccountSnapshot {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
