import type { Budget } from "@finanzas/domain";
import type { BudgetRepository } from "@finanzas/application";

/**
 * In-memory implementation of `BudgetRepository` for tests and local wiring.
 */
export class InMemoryBudgetRepository implements BudgetRepository {
  private readonly budgets = new Map<string, Budget>();

  constructor(seed: Budget[] = []) {
    for (const budget of seed) {
      this.budgets.set(budget.id, cloneBudget(budget));
    }
  }

  async findById(id: string): Promise<Budget | null> {
    const budget = this.budgets.get(id);
    return budget ? cloneBudget(budget) : null;
  }

  async findActiveByCategoryIdAndPeriod(
    categoryId: string,
    period: string,
  ): Promise<Budget | null> {
    for (const budget of this.budgets.values()) {
      if (
        budget.categoryId === categoryId &&
        budget.period === period &&
        budget.deletedAt === null
      ) {
        return cloneBudget(budget);
      }
    }

    return null;
  }

  async listAll(): Promise<Budget[]> {
    return [...this.budgets.values()].map(cloneBudget);
  }

  async save(budget: Budget): Promise<void> {
    this.budgets.set(budget.id, cloneBudget(budget));
  }
}

const cloneBudget = (budget: Budget): Budget => ({
  ...budget,
  limit: {
    ...budget.limit,
  },
  createdAt: new Date(budget.createdAt),
  updatedAt: new Date(budget.updatedAt),
  deletedAt: budget.deletedAt ? new Date(budget.deletedAt) : null,
});
