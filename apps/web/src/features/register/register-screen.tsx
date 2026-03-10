import type { FinanzasRegisterTabViewModel } from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  RegisterCategoriesCard,
  RegisterHeader,
  RegisterQuickAddCard,
  SuggestedCategoriesCard,
} from "./components/index.js";
import styles from "./register-screen.module.css";

/**
 * Props for `RegisterScreen`.
 */
export interface RegisterScreenProps {
  viewModel: FinanzasRegisterTabViewModel;
}

/**
 * React component for `Registrar` tab.
 */
export const RegisterScreen = ({
  viewModel,
}: RegisterScreenProps): JSX.Element => (
  <DashboardPage
    className={styles.page ?? ""}
    containerClassName={styles.container ?? ""}
  >
    <section data-view="register" className={styles.content}>
      <RegisterHeader
        account={viewModel.account}
        defaultDate={viewModel.defaultDate}
        categoryCount={viewModel.categories.length}
        suggestedCount={viewModel.suggestedCategoryIds.length}
      />

      <section className={styles.grid}>
        <RegisterQuickAddCard
          account={viewModel.account}
          defaultDate={viewModel.defaultDate}
          defaultCategoryId={viewModel.defaultCategoryId}
          categories={viewModel.categories}
        />
        <SuggestedCategoriesCard
          categories={viewModel.categories}
          suggestedCategoryIds={viewModel.suggestedCategoryIds}
        />
      </section>

      <div className={styles.catalogSection}>
        <RegisterCategoriesCard categories={viewModel.categories} />
      </div>
    </section>
  </DashboardPage>
);

/**
 * Renders the Register tab (`Registrar`) as HTML.
 */
export const renderRegisterScreen = (
  viewModel: FinanzasRegisterTabViewModel,
): string => renderToStaticMarkup(<RegisterScreen viewModel={viewModel} />);
