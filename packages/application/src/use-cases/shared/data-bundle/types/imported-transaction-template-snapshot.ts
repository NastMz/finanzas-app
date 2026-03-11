export interface ImportedTransactionTemplateSnapshot {
  id: string;
  name: string;
  accountId: string;
  amountMinor: bigint;
  currency: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
