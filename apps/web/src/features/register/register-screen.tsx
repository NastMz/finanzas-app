import type {
  FinanzasTransactionKind,
  FinanzasRegisterTabViewModel,
  FinanzasUiServiceContract,
  LoadRegisterTabInput,
} from "@finanzas/ui";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "../../ui/components/index.js";
import {
  RegisterCategoryOnboardingCard,
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
  categoryFeedback?: {
    tone: "success" | "error" | "offline";
    message: string;
  } | null;
  offline?: boolean;
  categoryNameInput?: string;
  categoryType?: FinanzasTransactionKind;
  isCreatingCategory?: boolean;
  onKindChange?: (kind: FinanzasTransactionKind) => void;
  onAmountInputChange?: (value: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  onCategoryNameChange?: (value: string) => void;
  onCategoryTypeChange?: (kind: FinanzasTransactionKind) => void;
  onNoteChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
  onSubmit?: () => void | Promise<void>;
  onCreateCategory?: () => void | Promise<void>;
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
  categoryFeedback,
  offline = false,
  categoryNameInput,
  categoryType,
  isCreatingCategory,
  onKindChange,
  onAmountInputChange,
  onCategoryChange,
  onCategoryNameChange,
  onCategoryTypeChange,
  onNoteChange,
  onDateChange,
  onSubmit,
  onCreateCategory,
}: RegisterScreenProps): JSX.Element => {
  const activeKind = kind ??
    viewModel.categories.find((category) => category.id === viewModel.defaultCategoryId)?.type ??
    (viewModel.categoryManagement.coverageByKind.expense.available ? "expense" : "income");
  const requiresRecovery = !viewModel.categoryManagement.coverageByKind[activeKind].available;

  return (
    <DashboardPage
      className={styles.page ?? ""}
      containerClassName={styles.container ?? ""}
    >
      <section data-view="register" className={styles.content}>
        {offline
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
              {...(categoryNameInput !== undefined ? { categoryNameInput } : {})}
              {...(categoryType !== undefined ? { categoryType } : {})}
              {...(isCreatingCategory !== undefined ? { isSaving: isCreatingCategory } : {})}
              {...(categoryFeedback !== undefined ? { feedback: categoryFeedback } : {})}
              {...(onCategoryNameChange !== undefined ? { onCategoryNameChange } : {})}
              {...(onCategoryTypeChange !== undefined ? { onCategoryTypeChange } : {})}
              {...(onCreateCategory !== undefined ? { onSubmit: onCreateCategory } : {})}
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
                {requiresRecovery
                  ? (
                    <RegisterCategoryOnboardingCard
                      categoryManagement={viewModel.categoryManagement}
                      surfaceMode="partial"
                      {...(categoryNameInput !== undefined ? { categoryNameInput } : {})}
                      {...(categoryType !== undefined ? { categoryType } : {})}
                      {...(isCreatingCategory !== undefined ? { isSaving: isCreatingCategory } : {})}
                      {...(categoryFeedback !== undefined ? { feedback: categoryFeedback } : {})}
                      {...(onCategoryNameChange !== undefined ? { onCategoryNameChange } : {})}
                      {...(onCategoryTypeChange !== undefined ? { onCategoryTypeChange } : {})}
                      {...(onCreateCategory !== undefined ? { onSubmit: onCreateCategory } : {})}
                    />
                    )
                  : (
                    <SuggestedCategoriesCard
                      categories={viewModel.categories}
                      suggestedCategoryIds={viewModel.suggestedCategoryIds}
                      {...(selectedCategoryId !== undefined ? { selectedCategoryId } : {})}
                      {...(onCategoryChange !== undefined ? { onSelectCategory: onCategoryChange } : {})}
                    />
                    )}
              </section>

              <div className={styles.catalogSection}>
                <RegisterCategoriesCard
                  categories={viewModel.categories}
                  {...(selectedCategoryId !== undefined ? { selectedCategoryId } : {})}
                  {...(onCategoryChange !== undefined ? { onSelectCategory: onCategoryChange } : {})}
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
