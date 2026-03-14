import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";

import { classNames } from "../../../ui/lib/class-names.js";
import { SurfaceCard } from "../../../ui/components/index.js";
import type { RegisterCategorySelectionContract } from "../register-contracts.js";
import styles from "./suggested-categories-card.module.css";

/**
 * Card with the most likely categories for quick entry.
 */
export interface SuggestedCategoriesCardProps {
  categories: FinanzasRegisterTabViewModel["categories"];
  suggestedCategoryIds: string[];
  categorySelection?: RegisterCategorySelectionContract;
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
  categorySelection,
}: SuggestedCategoriesCardProps): JSX.Element => {
  const selectedCategoryId = categorySelection?.selectedCategoryId ?? null;
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
                     selectedCategoryId === category.id ? styles.chipSelected : undefined,
                   )}
                  onClick={() => {
                    categorySelection?.onSelectCategory(category.id);
                  }}
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
