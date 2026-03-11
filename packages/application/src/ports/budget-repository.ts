import type { Budget } from "@finanzas/domain";

/**
 * Port for budget persistence operations required by application use cases.
 */
export interface BudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findActiveByCategoryIdAndPeriod(
    categoryId: string,
    period: string,
  ): Promise<Budget | null>;
  listAll(): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
  replaceAll(budgets: Budget[]): Promise<void>;
}
