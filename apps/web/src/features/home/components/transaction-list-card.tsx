import type { FinanzasHomeTabViewModel } from "@finanzas/ui";

import { SurfaceCard } from "../../../ui/components/index.js";
import { TransactionList } from "./transaction-list.js";

/**
 * Wrapper card for recent transaction list.
 */
export interface TransactionListCardProps {
  transactions: FinanzasHomeTabViewModel["recentTransactions"];
  transactionCount: number;
}

export const TransactionListCard = ({
  transactions,
  transactionCount,
}: TransactionListCardProps): JSX.Element => (
  <SurfaceCard
    title="Últimos movimientos"
    subtitle={`${transactionCount} en el periodo`}
  >
    <TransactionList transactions={transactions} />
  </SurfaceCard>
);
