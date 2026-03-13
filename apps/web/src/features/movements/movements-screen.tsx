import type {
  FinanzasCategoryOption,
  FinanzasMovementsTabViewModel,
  FinanzasTransactionKind,
  FinanzasUiServiceContract,
  LoadMovementsTabInput,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  type MovementsEditorDraft,
  MovementsEditorCard,
  MovementsHeader,
  MovementsListCard,
  MovementsTotalsCard,
} from "./components/index.js";
import styles from "./movements-screen.module.css";

/**
 * Props for `MovementsScreen`.
 */
export interface MovementsScreenProps {
  viewModel: FinanzasMovementsTabViewModel;
  categories?: FinanzasCategoryOption[];
  selectedTransactionId?: string | null;
  editDraft?: MovementsEditorDraft | null;
  isRefreshing?: boolean;
  isSavingEdit?: boolean;
  busyTransactionId?: string | null;
  feedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  offline?: boolean;
  onToggleIncludeDeleted?: () => void;
  onSelectTransaction?: (transactionId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onEditKindChange?: (kind: FinanzasTransactionKind) => void;
  onEditAmountChange?: (value: string) => void;
  onEditCategoryChange?: (value: string) => void;
  onEditDateChange?: (value: string) => void;
  onEditNoteChange?: (value: string) => void;
  onSaveEdit?: () => void | Promise<void>;
  onCancelEdit?: () => void;
}

/**
 * React component for `Movimientos` tab.
 */
export const MovementsScreen = ({
  viewModel,
  categories = [],
  selectedTransactionId = null,
  editDraft = null,
  isRefreshing = false,
  isSavingEdit = false,
  busyTransactionId = null,
  feedback = null,
  offline = false,
  onToggleIncludeDeleted,
  onSelectTransaction,
  onDeleteTransaction,
  onEditKindChange,
  onEditAmountChange,
  onEditCategoryChange,
  onEditDateChange,
  onEditNoteChange,
  onSaveEdit,
  onCancelEdit,
}: MovementsScreenProps): JSX.Element => {
  const deletedCount = viewModel.items.filter((item) => item.deleted).length;
  const selectedTransaction = viewModel.items.find((item) => item.id === selectedTransactionId) ?? null;

  return (
    <DashboardPage
      className={styles.page ?? ""}
      containerClassName={styles.container ?? ""}
    >
      <section data-view="movements" className={styles.content}>
        {offline
          ? <p className={`${styles.notice} ${styles.noticeOffline}`}>Sin conexion: podes seguir corrigiendo movimientos y quedan listos para sincronizar despues.</p>
          : null}

        {isRefreshing
          ? <p className={`${styles.notice} ${styles.noticeInfo}`}>Actualizando movimientos y resumen...</p>
          : null}

        <MovementsHeader
          account={viewModel.account}
          includeDeleted={viewModel.includeDeleted}
          sync={viewModel.sync}
          itemCount={viewModel.items.length}
          deletedCount={deletedCount}
          isRefreshing={isRefreshing}
          {...(onToggleIncludeDeleted !== undefined ? { onToggleIncludeDeleted } : {})}
        />

        <section className={styles.grid}>
          <aside className={styles.summaryColumn}>
            <div className={styles.summaryStack}>
              <MovementsTotalsCard
                currency={viewModel.account.currency}
                totals={viewModel.totals}
                itemCount={viewModel.items.length}
              />
              <MovementsEditorCard
                categories={categories}
                selectedTransaction={selectedTransaction}
                draft={editDraft}
                isSaving={isSavingEdit}
                feedback={feedback}
                {...(onEditKindChange !== undefined ? { onKindChange: onEditKindChange } : {})}
                {...(onEditAmountChange !== undefined ? { onAmountInputChange: onEditAmountChange } : {})}
                {...(onEditCategoryChange !== undefined ? { onCategoryChange: onEditCategoryChange } : {})}
                {...(onEditDateChange !== undefined ? { onDateChange: onEditDateChange } : {})}
                {...(onEditNoteChange !== undefined ? { onNoteChange: onEditNoteChange } : {})}
                {...(onSaveEdit !== undefined ? { onSave: onSaveEdit } : {})}
                {...(onCancelEdit !== undefined ? { onCancel: onCancelEdit } : {})}
              />
            </div>
          </aside>

          <div className={styles.listColumn}>
            <MovementsListCard
              items={viewModel.items}
              includeDeleted={viewModel.includeDeleted}
              selectedTransactionId={selectedTransactionId}
              busyTransactionId={busyTransactionId}
              {...(onSelectTransaction !== undefined ? { onSelectTransaction } : {})}
              {...(onDeleteTransaction !== undefined ? { onDeleteTransaction } : {})}
            />
          </div>
        </section>
      </section>
    </DashboardPage>
  );
};

/**
 * Renders the Movements tab (`Movimientos`) as HTML.
 */
export const renderMovementsScreen = (
  viewModel: FinanzasMovementsTabViewModel,
): string => renderToStaticMarkup(<MovementsScreen viewModel={viewModel} />);

/**
 * Loads Movements tab data and returns render-ready HTML.
 */
export const loadMovementsScreenHtml = async (
  loadMovementsTab: FinanzasUiServiceContract["loadMovementsTab"],
  input?: LoadMovementsTabInput,
): Promise<string> => renderMovementsScreen(await loadMovementsTab(input));
