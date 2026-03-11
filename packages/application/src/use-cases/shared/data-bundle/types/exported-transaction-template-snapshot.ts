export interface ExportedTransactionTemplateSnapshot {
  id: string;
  name: string;
  accountId: string;
  amountMinor: string;
  currency: string;
  categoryId: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
