import type {
  FinanzasTransactionKind,
  FinanzasRegisterTabViewModel,
  FinanzasUiServiceContract,
  LoadRegisterTabInput,
} from "@finanzas/ui";
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
  amountInput?: string;
  noteInput?: string;
  dateInput?: string;
  selectedCategoryId?: string | null;
  kind?: FinanzasTransactionKind;
  isSaving?: boolean;
  feedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  offline?: boolean;
  onKindChange?: (kind: FinanzasTransactionKind) => void;
  onAmountInputChange?: (value: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  onNoteChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onSubmit?: () => void | Promise<void>;
}

/**
 * React component for `Registrar` tab.
 */
export const RegisterScreen = ({
  viewModel,
  amountInput,
  noteInput,
  dateInput,
  selectedCategoryId,
  kind,
  isSaving,
  feedback,
  offline = false,
  onKindChange,
  onAmountInputChange,
  onCategoryChange,
  onNoteChange,
  onDateChange,
  onSubmit,
}: RegisterScreenProps): JSX.Element => (
  <DashboardPage
    className={styles.page ?? ""}
    containerClassName={styles.container ?? ""}
  >
    <section data-view="register" className={styles.content}>
      {offline
        ? <p className={`${styles.notice} ${styles.noticeOffline}`}>Sin conexion: los cambios quedan guardados en local y esperan sincronizacion.</p>
        : null}

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
          {...(amountInput !== undefined ? { amountInput } : {})}
          {...(noteInput !== undefined ? { noteInput } : {})}
          {...(dateInput !== undefined ? { dateInput } : {})}
          {...(selectedCategoryId !== undefined ? { selectedCategoryId } : {})}
          {...(kind !== undefined ? { kind } : {})}
          {...(isSaving !== undefined ? { isSaving } : {})}
          {...(feedback !== undefined ? { feedback } : {})}
          {...(onKindChange !== undefined ? { onKindChange } : {})}
          {...(onAmountInputChange !== undefined ? { onAmountInputChange } : {})}
          {...(onCategoryChange !== undefined ? { onCategoryChange } : {})}
          {...(onNoteChange !== undefined ? { onNoteChange } : {})}
          {...(onDateChange !== undefined ? { onDateChange } : {})}
          {...(onSubmit !== undefined ? { onSubmit } : {})}
        />
        <SuggestedCategoriesCard
          categories={viewModel.categories}
          suggestedCategoryIds={viewModel.suggestedCategoryIds}
          {...(selectedCategoryId !== undefined ? { selectedCategoryId } : {})}
          {...(onCategoryChange !== undefined ? { onSelectCategory: onCategoryChange } : {})}
        />
      </section>

      <div className={styles.catalogSection}>
        <RegisterCategoriesCard
          categories={viewModel.categories}
          {...(selectedCategoryId !== undefined ? { selectedCategoryId } : {})}
          {...(onCategoryChange !== undefined ? { onSelectCategory: onCategoryChange } : {})}
        />
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

/**
 * Loads Register tab data and returns render-ready HTML.
 */
export const loadRegisterScreenHtml = async (
  loadRegisterTab: FinanzasUiServiceContract["loadRegisterTab"],
  input?: LoadRegisterTabInput,
): Promise<string> => renderRegisterScreen(await loadRegisterTab(input));
