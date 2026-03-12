import type {
  FinanzasHomeTabViewModel,
  FinanzasUiServiceContract,
  LoadHomeTabInput,
} from "@finanzas/ui";
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
      <section className={styles.heroGrid}>
        <HomeHeader
          account={viewModel.account}
          period={viewModel.period}
          totals={viewModel.totals}
          sync={viewModel.sync}
          transactionCount={viewModel.transactionCount}
        />

        <SummaryCard
          currency={viewModel.account.currency}
          totals={viewModel.totals}
        />
      </section>

      <section className={styles.insightsGrid}>
        <TopCategoriesCard
          categories={viewModel.topExpenseCategories}
          currency={viewModel.account.currency}
          totalExpenseMinor={viewModel.totals.expenseMinor}
        />
        <TransactionListCard
          transactions={viewModel.recentTransactions}
          transactionCount={viewModel.transactionCount}
        />
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

/**
 * Loads Home tab data and returns render-ready HTML.
 */
export const loadHomeScreenHtml = async (
  loadHomeTab: FinanzasUiServiceContract["loadHomeTab"],
  input?: LoadHomeTabInput,
): Promise<string> => renderHomeScreen(await loadHomeTab(input));
