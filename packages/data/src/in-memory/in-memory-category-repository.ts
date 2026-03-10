import type { Category } from "@finanzas/domain";
import type { CategoryRepository } from "@finanzas/application";

/**
 * In-memory implementation of `CategoryRepository` for tests and local wiring.
 */
export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Category>();

  constructor(seed: Category[] = []) {
    for (const category of seed) {
      this.categories.set(category.id, cloneCategory(category));
    }
  }

  async findById(id: string): Promise<Category | null> {
    const category = this.categories.get(id);
    return category ? cloneCategory(category) : null;
  }

  async listAll(): Promise<Category[]> {
    return [...this.categories.values()].map(cloneCategory);
  }

  async save(category: Category): Promise<void> {
    this.categories.set(category.id, cloneCategory(category));
  }

  async replaceAll(categories: Category[]): Promise<void> {
    this.categories.clear();

    for (const category of categories) {
      this.categories.set(category.id, cloneCategory(category));
    }
  }
}

const cloneCategory = (category: Category): Category => ({
  ...category,
  createdAt: new Date(category.createdAt),
  updatedAt: new Date(category.updatedAt),
  deletedAt: category.deletedAt ? new Date(category.deletedAt) : null,
});
