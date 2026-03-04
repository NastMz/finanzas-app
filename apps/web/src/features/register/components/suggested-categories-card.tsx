import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import { classNames } from "../../../ui/lib/class-names.js";
import { SurfaceCard } from "../../../ui/components/index.js";
import styles from "./suggested-categories-card.module.css";

/**
 * Card with the most likely categories for quick entry.
 */
export interface SuggestedCategoriesCardProps {
  categories: FinanzasRegisterTabViewModel["categories"];
  suggestedCategoryIds: string[];
}

const resolveSuggestedCategories = (
  categories: FinanzasRegisterTabViewModel["categories"],
  suggestedCategoryIds: string[],
): FinanzasRegisterTabViewModel["categories"] =>
  suggestedCategoryIds
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is FinanzasRegisterTabViewModel["categories"][number] =>
      category !== undefined);

export const SuggestedCategoriesCard = ({
  categories,
  suggestedCategoryIds,
}: SuggestedCategoriesCardProps): JSX.Element => {
  const suggestedCategories = resolveSuggestedCategories(
    categories,
    suggestedCategoryIds,
  );

  return (
    <SurfaceCard
      title="Categorías sugeridas"
      subtitle="Basadas en uso reciente"
      className={styles.helperCard ?? ""}
      contentClassName={styles.helperContent ?? ""}
    >
      {suggestedCategories.length === 0
        ? <p className={styles.empty}>Sin sugerencias aún para esta cuenta.</p>
        : (
          <ul className={styles.chips}>
            {suggestedCategories.map((category) => (
              <li key={category.id} className={styles.chipItem}>
                <button
                  type="button"
                  className={classNames(
                    styles.chip,
                    category.type === "expense" ? styles.expense : styles.income,
                  )}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
          )}
    </SurfaceCard>
  );
};
