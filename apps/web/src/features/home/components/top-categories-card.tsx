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

const formatRank = (index: number): string => String(index + 1).padStart(2, "0");

export const TopCategoriesCard = ({
  currency,
  categories,
  totalExpenseMinor,
}: TopCategoriesCardProps): JSX.Element => {
  const totalMinor = resolveTotalExpenseMinor(categories, totalExpenseMinor);

  return (
    <SurfaceCard title="Donde se va el dinero" subtitle="Participacion del gasto">
      {categories.length === 0
        ? <p className={styles.empty}>Sin datos de categorias en el periodo.</p>
        : (
          <ul className={styles.list}>
            {categories.map((category, index) => {
              const percentage = toPercentage(category.expenseMinor, totalMinor);

              return (
                <li key={category.categoryId} className={styles.item}>
                  <div className={styles.headerRow}>
                    <div className={styles.identityBlock}>
                      <span className={styles.rank}>{formatRank(index)}</span>
                      <div className={styles.nameBlock}>
                        <p className={styles.name}>{category.categoryName}</p>
                        <p className={styles.helper}>{percentage.toFixed(1)}% del gasto total</p>
                      </div>
                    </div>
                    <strong className={styles.amount}>
                      {formatMinorAmount(category.expenseMinor, currency)}
                    </strong>
                  </div>
                  <div className={styles.track} aria-hidden="true">
                    <div
                      className={styles.fill}
                      style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          )}
    </SurfaceCard>
  );
};
