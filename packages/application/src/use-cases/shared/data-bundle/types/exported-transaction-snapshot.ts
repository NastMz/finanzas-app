export interface ExportedTransactionSnapshot {
  id: string;
  accountId: string;
  amountMinor: string;
  currency: string;
  date: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
