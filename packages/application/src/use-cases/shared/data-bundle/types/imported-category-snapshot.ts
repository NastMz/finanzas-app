import type { CategoryType } from "@finanzas/domain";

export interface ImportedCategorySnapshot {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number | null;
}
