import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { formatMinorAmount } from "../../shared/lib/formatters.js";
import styles from "./top-categories-card.module.css";

/**
 * Top expense categories card.
 */
export interface TopCategoriesCardProps {
  currency: string;
  categories: FinanzasHomeTabViewModel["topExpenseCategories"];
}

export const TopCategoriesCard = ({
  currency,
  categories,
}: TopCategoriesCardProps): JSX.Element => (
  <SurfaceCard title="Top categorías" subtitle="Gastos más representativos">
    {categories.length === 0
      ? <p className={styles.empty}>Sin datos de categorías en el periodo.</p>
      : (
        <ul className={styles.list}>
          {categories.map((category) => (
            <li key={category.categoryId} className={styles.item}>
              <p className={styles.name}>{category.categoryName}</p>
              <strong className={styles.amount}>
                {formatMinorAmount(category.expenseMinor, currency)}
              </strong>
            </li>
          ))}
        </ul>
        )}
  </SurfaceCard>
);
