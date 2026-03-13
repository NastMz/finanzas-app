import type { CategoryType } from "@finanzas/domain";

export interface CreateCategoryActionInput {
  name: string;
  type: CategoryType;
}
