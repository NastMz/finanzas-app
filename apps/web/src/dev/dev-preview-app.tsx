import { useEffect, useState } from "react";
import type {
  FinanzasAccountTabViewModel,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasSyncStatusViewModel,
} from "@finanzas/ui";

import { webCommands, webUi } from "../app/main.js";
import { AccountScreen } from "../features/account/account-screen.js";
import { useAccountOrchestration } from "../features/account/hooks/use-account-orchestration.js";
import { HomeScreen } from "../features/home/home-screen.js";
import { MovementsScreen } from "../features/movements/movements-screen.js";
import { useMovementsOrchestration } from "../features/movements/hooks/use-movements-orchestration.js";
import { RegisterScreen } from "../features/register/register-screen.js";
import { useRegisterOrchestration } from "../features/register/hooks/use-register-orchestration.js";
import {
  formatMinorAmount,
  getSyncStatusLabel,
  getSyncTone,
} from "../features/shared/lib/formatters.js";
import {
  applyHostRefreshOptions,
  createHostRefreshSeamState,
  type HostRefreshAdapter,
  mergeMovementsRefreshResult,
  syncHostMovementsReviewState,
  toMovementsLoadInput,
} from "../features/shared/lib/host-orchestration.js";
import { StatusPill } from "../ui/components/index.js";
import { classNames } from "../ui/lib/class-names.js";
import styles from "./dev-preview-app.module.css";

type PreviewTab = "home" | "movements" | "register" | "account";

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
    description: "Entrada rapida para registrar dinero en segundos.",
  },
  {
    id: "account",
    label: "Cuenta",
    description: "Estado general de la cuenta y sus categorias.",
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
  const [refreshSeam, setRefreshSeam] = useState(() => {
    if (movements.review === undefined) {
      throw new Error("Movements review metadata is required for host orchestration.");
    }

    return createHostRefreshSeamState({
      filters: movements.review.filters,
      page: {
        limit: movements.review.page.limit,
        continuation: movements.review.page.nextContinuation,
      },
      mode: movements.review.mode,
    });
  });
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
  const movementCategories = registerViewModel.categories;

  const refreshHost: HostRefreshAdapter = {
    refresh: async (options = {}) => {
      const nextRefreshSeam = applyHostRefreshOptions(refreshSeam, options);
      const [nextHome, nextMovements, nextRegister, nextAccount] = await Promise.all([
        webUi.loadHomeTab({
          accountId: currentAccountId,
          period: homeViewModel.period,
        }),
        webUi.loadMovementsTab(toMovementsLoadInput(currentAccountId, nextRefreshSeam)),
        webUi.loadRegisterTab({
          accountId: currentAccountId,
          suggestedCategoryLimit: 5,
        }),
        webUi.loadAccountTab(),
      ]);

      setHomeViewModel(nextHome);
      const resolvedMovements = mergeMovementsRefreshResult(
        movementsViewModel,
        nextMovements,
        nextRefreshSeam.movements.mode,
      );
      if (resolvedMovements.review === undefined) {
        throw new Error("Movements review metadata is required for host orchestration.");
      }

      setMovementsViewModel(resolvedMovements);
      setRegisterViewModel(nextRegister);
      setAccountViewModel(nextAccount);
      setRefreshSeam(syncHostMovementsReviewState(nextRefreshSeam, resolvedMovements.review));

      return {
        home: nextHome,
        movements: resolvedMovements,
        register: nextRegister,
        account: nextAccount,
      };
    },
  };

  const registerOrchestration = useRegisterOrchestration({
    viewModel: registerViewModel,
    accountId: currentAccountId,
    offline: isOffline,
    resetVersion: refreshSeam.registerResetVersion,
    refreshHost,
    mutations: {
      quickAddTransaction: (input) => webUi.quickAddTransaction(input),
      createCategory: (input) => webUi.createCategory(input),
    },
  });

  const movementsOrchestration = useMovementsOrchestration({
    viewModel: movementsViewModel,
    categories: movementCategories,
    offline: isOffline,
    refreshHost,
    mutations: {
      updateTransaction: (input) => webCommands.updateTransaction(input),
      deleteTransaction: (input) => webCommands.deleteTransaction(input),
      createCategory: (input) => webUi.createCategory(input),
    },
  });

  const accountOrchestration = useAccountOrchestration({
    viewModel: accountViewModel,
    offline: isOffline,
    refreshHost,
    mutations: {
      createCategory: (input) => webUi.createCategory(input),
    },
  });

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
            selection={movementsOrchestration.selection}
            editor={movementsOrchestration.editor}
            categoryCreation={movementsOrchestration.categoryCreation}
            listActions={movementsOrchestration.listActions}
          />
        );
      case "register":
        return (
          <RegisterScreen
            viewModel={registerViewModel}
            quickAdd={registerOrchestration.quickAdd}
            categoryCreation={registerOrchestration.categoryCreation}
            categorySelection={registerOrchestration.categorySelection}
          />
        );
      case "account":
        return (
          <AccountScreen
            viewModel={accountViewModel}
            categoryCreation={accountOrchestration.categoryCreation}
          />
        );
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
