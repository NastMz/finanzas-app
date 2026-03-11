import type { Category } from "@finanzas/domain";

/**
 * Port for category persistence operations required by application use cases.
 */
export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
  save(category: Category): Promise<void>;
  replaceAll(categories: Category[]): Promise<void>;
}
