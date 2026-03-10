import type { FinanzasAccountTabViewModel } from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  AccountHeader,
  EntityMetricsCard,
  SyncOverviewCard,
} from "./components/index.js";
import styles from "./account-screen.module.css";

/**
 * Props for `AccountScreen`.
 */
export interface AccountScreenProps {
  viewModel: FinanzasAccountTabViewModel;
}

/**
 * React component for `Cuenta` tab.
 */
export const AccountScreen = ({ viewModel }: AccountScreenProps): JSX.Element => (
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
          subtitle="Estado de entidades de cuenta"
          metrics={viewModel.accounts}
        />
        <EntityMetricsCard
          title="Categorías"
          subtitle="Estado de catalogo local"
          metrics={viewModel.categories}
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
