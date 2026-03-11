export interface ImportedTransactionSnapshot {
  id: string;
  accountId: string;
  amountMinor: bigint;
  currency: string;
  date: Date;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
