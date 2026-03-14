import type {
  FinanzasRegisterTabViewModel,
  FinanzasUiServiceContract,
  LoadRegisterTabInput,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import type { RegisterScreenProps } from "./register-contracts.js";
import {
  RegisterCategoryOnboardingCard,
  RegisterCategoriesCard,
  RegisterHeader,
  RegisterQuickAddCard,
  SuggestedCategoriesCard,
} from "./components/index.js";
import styles from "./register-screen.module.css";

/**
 * React component for `Registrar` tab.
 */
export const RegisterScreen = ({
  viewModel,
  quickAdd,
  categoryCreation,
  categorySelection,
}: RegisterScreenProps): JSX.Element => {
  const activeKind = quickAdd?.form.kind ??
    viewModel.categories.find((category) => category.id === viewModel.defaultCategoryId)?.type ??
    (viewModel.categoryManagement.coverageByKind.expense.available ? "expense" : "income");
  const requiresRecovery = !viewModel.categoryManagement.coverageByKind[activeKind].available;

  return (
    <DashboardPage
      className={styles.page ?? ""}
      containerClassName={styles.container ?? ""}
    >
      <section data-view="register" className={styles.content}>
        {quickAdd?.status.offline === true
          ? <p className={`${styles.notice} ${styles.noticeOffline}`}>Sin conexion: los cambios quedan guardados en este dispositivo hasta que vuelva la conexion.</p>
          : null}

        <RegisterHeader
          account={viewModel.account}
          defaultDate={viewModel.defaultDate}
          categoryCount={viewModel.categories.length}
          suggestedCount={viewModel.suggestedCategoryIds.length}
        />

        {viewModel.categoryManagement.status === "empty"
          ? (
            <RegisterCategoryOnboardingCard
              categoryManagement={viewModel.categoryManagement}
              surfaceMode="empty"
              {...(categoryCreation !== undefined ? { categoryCreation } : {})}
            />
            )
          : (
            <>
              <section className={styles.grid}>
                <RegisterQuickAddCard
                  account={viewModel.account}
                  categoryManagement={viewModel.categoryManagement}
                  defaultDate={viewModel.defaultDate}
                  defaultCategoryId={viewModel.defaultCategoryId}
                  categories={viewModel.categories}
                  {...(quickAdd !== undefined ? { quickAdd } : {})}
                />
                {requiresRecovery
                  ? (
                    <RegisterCategoryOnboardingCard
                      categoryManagement={viewModel.categoryManagement}
                      surfaceMode="partial"
                      {...(categoryCreation !== undefined ? { categoryCreation } : {})}
                    />
                    )
                  : (
                    <SuggestedCategoriesCard
                      categories={viewModel.categories}
                      suggestedCategoryIds={viewModel.suggestedCategoryIds}
                      {...(categorySelection !== undefined ? { categorySelection } : {})}
                    />
                    )}
              </section>

              <div className={styles.catalogSection}>
                <RegisterCategoriesCard
                  categories={viewModel.categories}
                  {...(categorySelection !== undefined ? { categorySelection } : {})}
                />
              </div>
            </>
            )}
      </section>
    </DashboardPage>
  );
};

/**
 * Renders the Register tab (`Registrar`) as HTML.
 */
export const renderRegisterScreen = (
  viewModel: FinanzasRegisterTabViewModel,
): string => renderToStaticMarkup(<RegisterScreen viewModel={viewModel} />);

/**
 * Loads Register tab data and returns render-ready HTML.
 */
export const loadRegisterScreenHtml = async (
  loadRegisterTab: FinanzasUiServiceContract["loadRegisterTab"],
  input?: LoadRegisterTabInput,
): Promise<string> => renderRegisterScreen(await loadRegisterTab(input));
