import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import { classNames } from "../../../ui/lib/class-names.js";
import { SurfaceCard } from "../../../ui/components/index.js";
import type { RegisterCategorySelectionContract } from "../register-contracts.js";
import styles from "./register-categories-card.module.css";

/**
 * Card with full category catalog available for registration.
 */
export interface RegisterCategoriesCardProps {
  categories: FinanzasRegisterTabViewModel["categories"];
  categorySelection?: RegisterCategorySelectionContract;
}

const splitCategories = (
  categories: FinanzasRegisterTabViewModel["categories"],
): {
  expense: FinanzasRegisterTabViewModel["categories"];
  income: FinanzasRegisterTabViewModel["categories"];
} => ({
  expense: categories.filter((category) => category.type === "expense"),
  income: categories.filter((category) => category.type === "income"),
});

export const RegisterCategoriesCard = ({
  categories,
  categorySelection,
}: RegisterCategoriesCardProps): JSX.Element => {
  const selectedCategoryId = categorySelection?.selectedCategoryId ?? null;
  const { expense, income } = splitCategories(categories);

  return (
    <SurfaceCard
      title="Catálogo de categorías"
      subtitle={`${categories.length} disponibles`}
      className={styles.catalogCard ?? ""}
      contentClassName={styles.catalogContent ?? ""}
    >
      <div className={styles.columns}>
        <section className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.title}>Gastos</h3>
            <span className={styles.count}>{expense.length}</span>
          </div>
          <ul className={styles.items}>
            {expense.map((category) => (
              <li
                key={category.id}
                className={classNames(styles.item, category.deleted ? styles.deleted : undefined)}
              >
                <button
                  type="button"
                  className={classNames(
                    styles.categoryButton,
                    selectedCategoryId === category.id ? styles.categoryButtonSelected : undefined,
                  )}
                  disabled={category.deleted}
                  onClick={() => {
                    categorySelection?.onSelectCategory(category.id);
                  }}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.title}>Ingresos</h3>
            <span className={styles.count}>{income.length}</span>
          </div>
          <ul className={styles.items}>
            {income.map((category) => (
              <li
                key={category.id}
                className={classNames(styles.item, category.deleted ? styles.deleted : undefined)}
              >
                <button
                  type="button"
                  className={classNames(
                    styles.categoryButton,
                    selectedCategoryId === category.id ? styles.categoryButtonSelected : undefined,
                  )}
                  disabled={category.deleted}
                  onClick={() => {
                    categorySelection?.onSelectCategory(category.id);
                  }}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SurfaceCard>
  );
};
