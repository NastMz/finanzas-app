export interface ExportedBudgetSnapshot {
  id: string;
  categoryId: string;
  period: string;
  limitAmountMinor: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
