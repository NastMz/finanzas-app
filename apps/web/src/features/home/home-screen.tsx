import type { FinanzasHomeTabViewModel } from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  HomeHeader,
  SummaryCard,
  TopCategoriesCard,
  TransactionListCard,
} from "./components/index.js";
import styles from "./home-screen.module.css";

/**
 * Props for `HomeScreen`.
 */
export interface HomeScreenProps {
  viewModel: FinanzasHomeTabViewModel;
}

/**
 * React component for `Inicio` tab.
 */
export const HomeScreen = ({ viewModel }: HomeScreenProps): JSX.Element => (
  <DashboardPage
    className={styles.page ?? ""}
    containerClassName={styles.container ?? ""}
  >
    <section data-view="home" className={styles.content}>
      <HomeHeader
        account={viewModel.account}
        period={viewModel.period}
        sync={viewModel.sync}
      />

      <section className={styles.grid}>
        <SummaryCard
          currency={viewModel.account.currency}
          totals={viewModel.totals}
        />
        <TopCategoriesCard
          categories={viewModel.topExpenseCategories}
          currency={viewModel.account.currency}
        />

        <div className={styles.spanFull}>
          <TransactionListCard
            transactions={viewModel.recentTransactions}
            transactionCount={viewModel.transactionCount}
          />
        </div>
      </section>
    </section>
  </DashboardPage>
);

/**
 * Renders the Home tab (`Inicio`) as HTML.
 */
export const renderHomeScreen = (
  viewModel: FinanzasHomeTabViewModel,
): string => renderToStaticMarkup(<HomeScreen viewModel={viewModel} />);
