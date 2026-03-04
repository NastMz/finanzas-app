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
  totalExpenseMinor: bigint;
}

const getAbsoluteMinor = (amountMinor: bigint): bigint =>
  amountMinor < 0n ? -amountMinor : amountMinor;

const resolveTotalExpenseMinor = (
  categories: FinanzasHomeTabViewModel["topExpenseCategories"],
  totalExpenseMinor: bigint,
): bigint => {
  const normalizedTotal = getAbsoluteMinor(totalExpenseMinor);

  if (normalizedTotal > 0n) {
    return normalizedTotal;
  }

  return categories.reduce(
    (acc, category) => acc + getAbsoluteMinor(category.expenseMinor),
    0n,
  );
};

const toPercentage = (valueMinor: bigint, totalMinor: bigint): number => {
  if (totalMinor <= 0n) {
    return 0;
  }

  const normalizedValue = getAbsoluteMinor(valueMinor);
  const basisPoints = Number((normalizedValue * 10000n) / totalMinor);
  return basisPoints / 100;
};

export const TopCategoriesCard = ({
  currency,
  categories,
  totalExpenseMinor,
}: TopCategoriesCardProps): JSX.Element => {
  const totalMinor = resolveTotalExpenseMinor(categories, totalExpenseMinor);

  return (
    <SurfaceCard title="Top categorías" subtitle="Gastos más representativos">
      {categories.length === 0
        ? <p className={styles.empty}>Sin datos de categorías en el periodo.</p>
        : (
          <ul className={styles.list}>
            {categories.map((category) => {
              const percentage = toPercentage(category.expenseMinor, totalMinor);

              return (
                <li key={category.categoryId} className={styles.item}>
                  <div className={styles.row}>
                    <p className={styles.name}>{category.categoryName}</p>
                    <p className={styles.percent}>{percentage.toFixed(1)}%</p>
                  </div>
                  <div className={styles.track} aria-hidden="true">
                    <div
                      className={styles.fill}
                      style={{ width: `${Math.min(100, Math.max(6, percentage))}%` }}
                    />
                  </div>
                  <strong className={styles.amount}>
                    {formatMinorAmount(category.expenseMinor, currency)}
                  </strong>
                </li>
              );
            })}
          </ul>
          )}
    </SurfaceCard>
  );
};
