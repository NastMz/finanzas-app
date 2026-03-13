import { useEffect, useMemo, useState } from "react";
import type {
  FinanzasAccountTabViewModel,
  FinanzasCategoryOption,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasSyncStatusViewModel,
  FinanzasTransactionItemViewModel,
  FinanzasTransactionKind,
} from "@finanzas/ui";

import { webCommands, webUi } from "../app/main.js";
import { AccountScreen } from "../features/account/account-screen.js";
import { HomeScreen } from "../features/home/home-screen.js";
import type { MovementsEditorDraft } from "../features/movements/components/index.js";
import { MovementsScreen } from "../features/movements/movements-screen.js";
import { RegisterScreen } from "../features/register/register-screen.js";
import {
  formatMinorAmount,
  getSyncStatusLabel,
  getSyncTone,
} from "../features/shared/lib/formatters.js";
import { StatusPill } from "../ui/components/index.js";
import { classNames } from "../ui/lib/class-names.js";
import styles from "./dev-preview-app.module.css";

type PreviewTab = "home" | "movements" | "register" | "account";

interface InteractionNotice {
  tone: "success" | "error" | "offline";
  message: string;
}

interface RegisterFormState {
  amountInput: string;
  noteInput: string;
  dateInput: string;
  selectedCategoryId: string | null;
  kind: FinanzasTransactionKind;
}

const tabConfig: Array<{
  id: PreviewTab;
  label: string;
  description: string;
}> = [
  {
    id: "home",
    label: "Inicio",
    description: "Balance, cashflow y actividad reciente.",
  },
  {
    id: "movements",
    label: "Movimientos",
    description: "Lectura limpia del historial y del ritmo de gasto.",
  },
  {
    id: "register",
    label: "Registrar",
    description: "Entrada rapida para capturar dinero en segundos.",
  },
  {
    id: "account",
    label: "Cuenta",
    description: "Salud de sincronizacion y control del catalogo.",
  },
];

export interface DevPreviewAppProps {
  home: FinanzasHomeTabViewModel;
  movements: FinanzasMovementsTabViewModel;
  register: FinanzasRegisterTabViewModel;
  account: FinanzasAccountTabViewModel;
}

const resolveSyncModel = (
  activeTab: PreviewTab,
  home: FinanzasHomeTabViewModel,
  movements: FinanzasMovementsTabViewModel,
  account: FinanzasAccountTabViewModel,
): FinanzasSyncStatusViewModel => {
  switch (activeTab) {
    case "movements":
      return movements.sync;
    case "account":
      return account.sync;
    case "home":
    case "register":
      return home.sync;
  }
};

const resolveTabMeta = (
  tab: PreviewTab,
  movements: FinanzasMovementsTabViewModel,
  register: FinanzasRegisterTabViewModel,
  account: FinanzasAccountTabViewModel,
): string => {
  switch (tab) {
    case "home":
      return "Hoy";
    case "movements":
      return `${movements.items.length} items`;
    case "register":
      return `${register.suggestedCategoryIds.length} sugeridas`;
    case "account":
      return `${account.accounts.total + account.categories.total} entidades`;
  }
};

const toDateTimeLocalValue = (value: Date): string => value.toISOString().slice(0, 16);

const resolveCategoriesByKind = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
): FinanzasCategoryOption[] => categories.filter((category) => !category.deleted && category.type === kind);

const resolveCategoryForKind = (
  categories: FinanzasCategoryOption[],
  kind: FinanzasTransactionKind,
  preferredCategoryId?: string | null,
): string | null => {
  const matchingCategories = resolveCategoriesByKind(categories, kind);
  const preferredCategory = matchingCategories.find((category) => category.id === preferredCategoryId);
  return preferredCategory?.id ?? matchingCategories[0]?.id ?? null;
};

const createRegisterFormState = (
  register: FinanzasRegisterTabViewModel,
): RegisterFormState => {
  const defaultCategory = register.categories.find(
    (category) => category.id === register.defaultCategoryId,
  );
  const kind = defaultCategory?.type ?? "expense";

  return {
    amountInput: "",
    noteInput: "",
    dateInput: toDateTimeLocalValue(register.defaultDate),
    selectedCategoryId: resolveCategoryForKind(
      register.categories,
      kind,
      register.defaultCategoryId,
    ),
    kind,
  };
};

const createMovementDraft = (
  transaction: FinanzasTransactionItemViewModel | null,
): MovementsEditorDraft | null => {
  if (transaction === null || transaction.deleted) {
    return null;
  }

  return {
    amountInput: transaction.amountMinor.toString(),
    categoryId: transaction.categoryId,
    dateInput: toDateTimeLocalValue(transaction.date),
    noteInput: transaction.note ?? "",
    kind: transaction.kind,
  };
};

const resolveNextSelectedTransactionId = (
  items: FinanzasTransactionItemViewModel[],
  preferredId: string | null,
): string | null => {
  const preferred = items.find((item) => item.id === preferredId && !item.deleted);

  if (preferred !== undefined) {
    return preferred.id;
  }

  return items.find((item) => !item.deleted)?.id ?? null;
};

const parseMinorAmount = (value: string): bigint | null => {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const amount = BigInt(normalized);
  return amount > 0n ? amount : null;
};

const getOfflineState = (): boolean => !(globalThis.navigator?.onLine ?? true);

export const DevPreviewApp = ({
  home,
  movements,
  register,
  account,
}: DevPreviewAppProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("home");
  const [homeViewModel, setHomeViewModel] = useState(home);
  const [movementsViewModel, setMovementsViewModel] = useState(movements);
  const [registerViewModel, setRegisterViewModel] = useState(register);
  const [accountViewModel, setAccountViewModel] = useState(account);
  const [registerForm, setRegisterForm] = useState(() => createRegisterFormState(register));
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(
    resolveNextSelectedTransactionId(movements.items, null),
  );
  const [movementDraft, setMovementDraft] = useState<MovementsEditorDraft | null>(() => {
    const initialTransaction = movements.items.find(
      (item) => item.id === resolveNextSelectedTransactionId(movements.items, null),
    ) ?? null;
    return createMovementDraft(initialTransaction);
  });
  const [isRefreshingMovements, setIsRefreshingMovements] = useState(false);
  const [isSavingRegister, setIsSavingRegister] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [busyTransactionId, setBusyTransactionId] = useState<string | null>(null);
  const [registerFeedback, setRegisterFeedback] = useState<InteractionNotice | null>(null);
  const [movementsFeedback, setMovementsFeedback] = useState<InteractionNotice | null>(null);
  const [isOffline, setIsOffline] = useState(getOfflineState());

  useEffect(() => {
    const syncOnlineState = (): void => {
      setIsOffline(getOfflineState());
    };

    syncOnlineState();
    globalThis.addEventListener?.("online", syncOnlineState);
    globalThis.addEventListener?.("offline", syncOnlineState);

    return () => {
      globalThis.removeEventListener?.("online", syncOnlineState);
      globalThis.removeEventListener?.("offline", syncOnlineState);
    };
  }, []);

  const currentAccountId = homeViewModel.account.id;
  const movementCategories = useMemo(
    () => registerViewModel.categories,
    [registerViewModel.categories],
  );

  const selectedTransaction = useMemo(
    () => movementsViewModel.items.find((item) => item.id === selectedTransactionId) ?? null,
    [movementsViewModel.items, selectedTransactionId],
  );

  useEffect(() => {
    setMovementDraft(createMovementDraft(selectedTransaction));
  }, [selectedTransaction]);

  const reloadTabs = async (
    options: {
      includeDeleted?: boolean;
      preferredTransactionId?: string | null;
      resetRegisterForm?: boolean;
    } = {},
  ): Promise<void> => {
    const nextIncludeDeleted = options.includeDeleted ?? movementsViewModel.includeDeleted;
    const [nextHome, nextMovements, nextRegister, nextAccount] = await Promise.all([
      webUi.loadHomeTab({
        accountId: currentAccountId,
        period: homeViewModel.period,
      }),
      webUi.loadMovementsTab({
        accountId: currentAccountId,
        includeDeleted: nextIncludeDeleted,
        limit: 12,
      }),
      webUi.loadRegisterTab({
        accountId: currentAccountId,
        suggestedCategoryLimit: 5,
      }),
      webUi.loadAccountTab(),
    ]);

    setHomeViewModel(nextHome);
    setMovementsViewModel(nextMovements);
    setRegisterViewModel(nextRegister);
    setAccountViewModel(nextAccount);

    if (options.resetRegisterForm === true) {
      setRegisterForm(createRegisterFormState(nextRegister));
    }

    setSelectedTransactionId(
      resolveNextSelectedTransactionId(
        nextMovements.items,
        options.preferredTransactionId ?? selectedTransactionId,
      ),
    );
  };

  const handleRegisterKindChange = (kind: FinanzasTransactionKind): void => {
    setRegisterForm((current) => ({
      ...current,
      kind,
      selectedCategoryId: resolveCategoryForKind(
        registerViewModel.categories,
        kind,
        current.selectedCategoryId,
      ),
    }));
  };

  const handleRegisterCategoryChange = (categoryId: string): void => {
    const selectedCategory = registerViewModel.categories.find(
      (category) => category.id === categoryId,
    );

    setRegisterForm((current) => ({
      ...current,
      selectedCategoryId: categoryId,
      kind: selectedCategory?.type ?? current.kind,
    }));
  };

  const handleRegisterSubmit = async (): Promise<void> => {
    const amountMinor = parseMinorAmount(registerForm.amountInput);

    if (amountMinor === null) {
      setRegisterFeedback({
        tone: "error",
        message: "El monto tiene que ser un entero positivo en unidades menores.",
      });
      return;
    }

    if (registerForm.selectedCategoryId === null) {
      setRegisterFeedback({
        tone: "error",
        message: "Elegi una categoria activa antes de guardar.",
      });
      return;
    }

    const transactionDate = new Date(registerForm.dateInput);

    if (Number.isNaN(transactionDate.valueOf())) {
      setRegisterFeedback({
        tone: "error",
        message: "La fecha no es valida.",
      });
      return;
    }

    setIsSavingRegister(true);
    setRegisterFeedback(null);

    try {
      const result = await webUi.quickAddTransaction({
        accountId: currentAccountId,
        amountMinor,
        categoryId: registerForm.selectedCategoryId,
        date: transactionDate,
        kind: registerForm.kind,
        note: registerForm.noteInput.trim(),
      });

      await reloadTabs({
        preferredTransactionId: result.transactionId,
        resetRegisterForm: true,
      });
      setRegisterFeedback({
        tone: isOffline ? "offline" : "success",
        message: isOffline
          ? "Movimiento guardado en local. Se sincroniza cuando vuelva la conexion."
          : "Movimiento registrado y reflejado en Movimientos.",
      });
    } catch (error) {
      setRegisterFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo registrar el movimiento.",
      });
    } finally {
      setIsSavingRegister(false);
    }
  };

  const handleToggleIncludeDeleted = async (): Promise<void> => {
    const nextIncludeDeleted = !movementsViewModel.includeDeleted;
    setIsRefreshingMovements(true);
    setMovementsFeedback(null);

    try {
      await reloadTabs({
        includeDeleted: nextIncludeDeleted,
      });
    } catch (error) {
      setMovementsFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar la lista.",
      });
    } finally {
      setIsRefreshingMovements(false);
    }
  };

  const handleSelectTransaction = (transactionId: string): void => {
    setSelectedTransactionId(transactionId);
    setMovementsFeedback(null);
  };

  const handleMovementKindChange = (kind: FinanzasTransactionKind): void => {
    setMovementDraft((current) => {
      if (current === null) {
        return current;
      }

      return {
        ...current,
        kind,
        categoryId: resolveCategoryForKind(movementCategories, kind, current.categoryId) ?? "",
      };
    });
  };

  const handleMovementSave = async (): Promise<void> => {
    if (selectedTransaction === null || movementDraft === null) {
      setMovementsFeedback({
        tone: "error",
        message: "Selecciona un movimiento activo antes de guardar cambios.",
      });
      return;
    }

    const amountMinor = parseMinorAmount(movementDraft.amountInput);

    if (amountMinor === null) {
      setMovementsFeedback({
        tone: "error",
        message: "El monto tiene que ser un entero positivo en unidades menores.",
      });
      return;
    }

    const transactionDate = new Date(movementDraft.dateInput);

    if (Number.isNaN(transactionDate.valueOf())) {
      setMovementsFeedback({
        tone: "error",
        message: "La fecha no es valida.",
      });
      return;
    }

    setIsSavingMovement(true);
    setBusyTransactionId(selectedTransaction.id);
    setMovementsFeedback(null);

    try {
      await webCommands.updateTransaction({
        transactionId: selectedTransaction.id,
        amountMinor: movementDraft.kind === "expense" ? -amountMinor : amountMinor,
        categoryId: movementDraft.categoryId,
        date: transactionDate,
        note: movementDraft.noteInput.trim(),
      });
      await reloadTabs({
        preferredTransactionId: selectedTransaction.id,
      });
      setMovementsFeedback({
        tone: isOffline ? "offline" : "success",
        message: isOffline
          ? "Cambio guardado en local. Falta sincronizarlo cuando vuelva la conexion."
          : "Movimiento actualizado y resumen recalculado.",
      });
    } catch (error) {
      setMovementsFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar el movimiento.",
      });
    } finally {
      setIsSavingMovement(false);
      setBusyTransactionId(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string): Promise<void> => {
    if (!globalThis.confirm?.("Eliminar este movimiento?")) {
      return;
    }

    setBusyTransactionId(transactionId);
    setMovementsFeedback(null);

    try {
      await webCommands.deleteTransaction({
        transactionId,
      });
      await reloadTabs({
        preferredTransactionId: null,
      });
      setMovementsFeedback({
        tone: isOffline ? "offline" : "success",
        message: isOffline
          ? "Movimiento eliminado en local. Queda pendiente de sincronizacion."
          : "Movimiento eliminado y lista actualizada.",
      });
    } catch (error) {
      setMovementsFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo eliminar el movimiento.",
      });
    } finally {
      setBusyTransactionId(null);
    }
  };

  const activeTabConfig = tabConfig.find((tab) => tab.id === activeTab) ?? {
    id: "home",
    label: "Inicio",
    description: "Balance, cashflow y actividad reciente.",
  };
  const activeSync = resolveSyncModel(
    activeTab,
    homeViewModel,
    movementsViewModel,
    accountViewModel,
  );
  const navigationMetrics = [
    {
      label: "Disponible",
      value: formatMinorAmount(homeViewModel.totals.netMinor, homeViewModel.account.currency),
    },
    {
      label: "Movimientos",
      value: String(movementsViewModel.items.length),
    },
    {
      label: "Categorias",
      value: String(registerViewModel.categories.length),
    },
  ];

  const renderActiveScreen = (): JSX.Element => {
    switch (activeTab) {
      case "movements":
        return (
          <MovementsScreen
            viewModel={movementsViewModel}
            categories={movementCategories}
            selectedTransactionId={selectedTransactionId}
            editDraft={movementDraft}
            isRefreshing={isRefreshingMovements}
            isSavingEdit={isSavingMovement}
            busyTransactionId={busyTransactionId}
            feedback={movementsFeedback}
            offline={isOffline}
            onToggleIncludeDeleted={() => {
              void handleToggleIncludeDeleted();
            }}
            onSelectTransaction={handleSelectTransaction}
            onDeleteTransaction={(transactionId) => {
              void handleDeleteTransaction(transactionId);
            }}
            onEditKindChange={handleMovementKindChange}
            onEditAmountChange={(value) => {
              setMovementDraft((current) => current === null ? current : { ...current, amountInput: value });
            }}
            onEditCategoryChange={(value) => {
              setMovementDraft((current) => current === null ? current : { ...current, categoryId: value });
            }}
            onEditDateChange={(value) => {
              setMovementDraft((current) => current === null ? current : { ...current, dateInput: value });
            }}
            onEditNoteChange={(value) => {
              setMovementDraft((current) => current === null ? current : { ...current, noteInput: value });
            }}
            onSaveEdit={() => {
              void handleMovementSave();
            }}
            onCancelEdit={() => {
              setSelectedTransactionId(null);
              setMovementsFeedback(null);
            }}
          />
        );
      case "register":
        return (
          <RegisterScreen
            viewModel={registerViewModel}
            amountInput={registerForm.amountInput}
            noteInput={registerForm.noteInput}
            dateInput={registerForm.dateInput}
            selectedCategoryId={registerForm.selectedCategoryId}
            kind={registerForm.kind}
            isSaving={isSavingRegister}
            feedback={registerFeedback}
            offline={isOffline}
            onKindChange={handleRegisterKindChange}
            onAmountInputChange={(value) => {
              setRegisterForm((current) => ({ ...current, amountInput: value }));
            }}
            onCategoryChange={handleRegisterCategoryChange}
            onNoteChange={(value) => {
              setRegisterForm((current) => ({ ...current, noteInput: value }));
            }}
            onDateChange={(value) => {
              setRegisterForm((current) => ({ ...current, dateInput: value }));
            }}
            onSubmit={() => {
              void handleRegisterSubmit();
            }}
          />
        );
      case "account":
        return <AccountScreen viewModel={accountViewModel} />;
      case "home":
        return <HomeScreen viewModel={homeViewModel} />;
    }
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <section className={styles.brandPanel}>
          <p className={styles.brandEyebrow}>Money workspace</p>
          <h1 className={styles.brandTitle}>Finanzas App</h1>
          <p className={styles.brandCopy}>
            Una vision diaria, clara y accionable del dinero que entra, sale y queda disponible.
          </p>

          <div className={styles.accountPanel}>
            <div>
              <p className={styles.accountLabel}>Cuenta principal</p>
              <strong className={styles.accountName}>{homeViewModel.account.name}</strong>
            </div>
            <span className={styles.accountCurrency}>{homeViewModel.account.currency}</span>
          </div>

          <StatusPill
            label={getSyncStatusLabel(activeSync.status)}
            tone={getSyncTone(activeSync.status)}
            className={styles.brandStatus ?? ""}
          />
        </section>

        <nav className={styles.navPanel} aria-label="Navegacion principal">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={classNames(
                styles.navButton,
                activeTab === tab.id ? styles.activeNavButton : undefined,
              )}
              onClick={() => {
                setActiveTab(tab.id);
              }}
            >
              <span className={styles.navButtonTopRow}>
                <span className={styles.navLabel}>{tab.label}</span>
                <span className={styles.navMeta}>
                  {resolveTabMeta(tab.id, movementsViewModel, registerViewModel, accountViewModel)}
                </span>
              </span>
              <span className={styles.navDescription}>{tab.description}</span>
            </button>
          ))}
        </nav>

        <section className={styles.sidebarPanel}>
          <p className={styles.sidebarPanelLabel}>Panorama mensual</p>
          <ul className={styles.metricList} role="list">
            {navigationMetrics.map((metric) => (
              <li key={metric.label} className={styles.metricItem}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarCopyBlock}>
            <p className={styles.topbarEyebrow}>Workspace</p>
            <h2 className={styles.topbarTitle}>{activeTabConfig.label}</h2>
            <p className={styles.topbarCopy}>{activeTabConfig.description}</p>
          </div>

          <div className={styles.topbarMetrics}>
            <div className={styles.topbarMetric}>
              <span>Periodo</span>
              <strong>{homeViewModel.period.label}</strong>
            </div>
            <div className={styles.topbarMetric}>
              <span>Pendientes</span>
              <strong>{activeSync.pendingOps}</strong>
            </div>
            <div className={styles.topbarMetric}>
              <span>Catalogo</span>
              <strong>{registerViewModel.categories.length}</strong>
            </div>
          </div>
        </header>

        <section className={styles.viewport}>{renderActiveScreen()}</section>

        <nav className={styles.mobileNav} aria-label="Navegacion inferior">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={classNames(
                styles.mobileNavButton,
                activeTab === tab.id ? styles.mobileNavButtonActive : undefined,
              )}
              onClick={() => {
                setActiveTab(tab.id);
              }}
            >
              <span className={styles.mobileNavLabel}>{tab.label}</span>
              <span className={styles.mobileNavMeta}>
                {resolveTabMeta(tab.id, movementsViewModel, registerViewModel, accountViewModel)}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
