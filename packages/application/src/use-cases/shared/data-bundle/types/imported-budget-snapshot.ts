export interface ImportedBudgetSnapshot {
  id: string;
  categoryId: string;
  period: string;
  limitAmountMinor: bigint;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
