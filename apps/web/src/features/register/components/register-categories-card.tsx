import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import { classNames } from "../../../ui/lib/class-names.js";
import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./register-categories-card.module.css";

/**
 * Card with full category catalog available for registration.
 */
export interface RegisterCategoriesCardProps {
  categories: FinanzasRegisterTabViewModel["categories"];
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
}: RegisterCategoriesCardProps): JSX.Element => {
  const { expense, income } = splitCategories(categories);

  return (
    <SurfaceCard title="Catálogo de categorías" subtitle={`${categories.length} disponibles`}>
      <div className={styles.columns}>
        <section className={styles.column}>
          <h3 className={styles.title}>Gastos</h3>
          <ul className={styles.items}>
            {expense.map((category) => (
              <li
                key={category.id}
                className={classNames(styles.item, category.deleted ? styles.deleted : undefined)}
              >
                {category.name}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.column}>
          <h3 className={styles.title}>Ingresos</h3>
          <ul className={styles.items}>
            {income.map((category) => (
              <li
                key={category.id}
                className={classNames(styles.item, category.deleted ? styles.deleted : undefined)}
              >
                {category.name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SurfaceCard>
  );
};
