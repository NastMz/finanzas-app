import type { CategoryType } from "@finanzas/domain";

export interface ExportedCategorySnapshot {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number | null;
}
