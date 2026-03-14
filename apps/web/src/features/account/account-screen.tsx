import type {
  FinanzasAccountTabViewModel,
  FinanzasUiServiceContract,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import type { AccountScreenProps } from "./account-contracts.js";
import {
  AccountHeader,
  CategoryCoverageCard,
  EntityMetricsCard,
  SyncOverviewCard,
} from "./components/index.js";
import styles from "./account-screen.module.css";

/**
 * React component for `Cuenta` tab.
 */
export const AccountScreen = ({
  viewModel,
  categoryCreation,
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
          {...(categoryCreation !== undefined ? { categoryCreation } : {})}
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
