import type {
  FinanzasTransactionKind,
  FinanzasAccountTabViewModel,
  FinanzasUiServiceContract,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  AccountHeader,
  CategoryCoverageCard,
  EntityMetricsCard,
  SyncOverviewCard,
} from "./components/index.js";
import styles from "./account-screen.module.css";

/**
 * Props for `AccountScreen`.
 */
export interface AccountScreenProps {
  viewModel: FinanzasAccountTabViewModel;
  categoryFeedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  categoryNameInput?: string;
  categoryType?: FinanzasTransactionKind;
  isCreatingCategory?: boolean;
  onCategoryNameChange?: (value: string) => void;
  onCategoryTypeChange?: (kind: FinanzasTransactionKind) => void;
  onCreateCategory?: () => void | Promise<void>;
}

/**
 * React component for `Cuenta` tab.
 */
export const AccountScreen = ({
  viewModel,
  categoryFeedback,
  categoryNameInput,
  categoryType,
  isCreatingCategory,
  onCategoryNameChange,
  onCategoryTypeChange,
  onCreateCategory,
}: AccountScreenProps): JSX.Element => (
  <DashboardPage
    className={styles.page ?? ""}
    containerClassName={styles.container ?? ""}
  >
    <section data-view="account" className={styles.content}>
      <AccountHeader
        sync={viewModel.sync}
        accounts={viewModel.accounts}
        categories={viewModel.categories}
      />

      <section className={styles.grid}>
        <div className={styles.syncPanel}>
          <SyncOverviewCard sync={viewModel.sync} />
        </div>
        <EntityMetricsCard
          title="Cuentas"
          subtitle="Resumen de tus cuentas"
          metrics={viewModel.accounts}
        />
        <EntityMetricsCard
          title="Categorías"
          subtitle="Resumen de tus categorias"
          metrics={viewModel.categories}
        />
        <CategoryCoverageCard
          categoryManagement={viewModel.categoryManagement}
          {...(categoryFeedback !== undefined ? { feedback: categoryFeedback } : {})}
          {...(categoryNameInput !== undefined ? { categoryNameInput } : {})}
          {...(categoryType !== undefined ? { categoryType } : {})}
          {...(isCreatingCategory !== undefined ? { isSaving: isCreatingCategory } : {})}
          {...(onCategoryNameChange !== undefined ? { onCategoryNameChange } : {})}
          {...(onCategoryTypeChange !== undefined ? { onCategoryTypeChange } : {})}
          {...(onCreateCategory !== undefined ? { onSubmit: onCreateCategory } : {})}
        />
      </section>
    </section>
  </DashboardPage>
);

/**
 * Renders the Account tab (`Cuenta`) as HTML.
 */
export const renderAccountScreen = (
  viewModel: FinanzasAccountTabViewModel,
): string => renderToStaticMarkup(<AccountScreen viewModel={viewModel} />);

/**
 * Loads Account tab data and returns render-ready HTML.
 */
export const loadAccountScreenHtml = async (
  loadAccountTab: FinanzasUiServiceContract["loadAccountTab"],
): Promise<string> => renderAccountScreen(await loadAccountTab());
