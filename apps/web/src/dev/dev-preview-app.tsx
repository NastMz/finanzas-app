import { useState } from "react";
import type {
  FinanzasAccountTabViewModel,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
  FinanzasSyncStatusViewModel,
} from "@finanzas/ui";

import { AccountScreen } from "../screens/account-screen.js";
import { HomeScreen } from "../screens/home-screen.js";
import { MovementsScreen } from "../screens/movements-screen.js";
import { RegisterScreen } from "../screens/register-screen.js";
import {
  formatMinorAmount,
  getSyncStatusLabel,
  getSyncTone,
} from "../features/shared/lib/formatters.js";
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
    description: "Entrada rapida para capturar dinero en segundos.",
  },
  {
    id: "account",
    label: "Cuenta",
    description: "Salud de sincronizacion y control del catalogo.",
  },
];

/**
 * Props for local dev preview app.
 */
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

const renderActiveScreen = (
  activeTab: PreviewTab,
  home: FinanzasHomeTabViewModel,
  movements: FinanzasMovementsTabViewModel,
  register: FinanzasRegisterTabViewModel,
  account: FinanzasAccountTabViewModel,
): JSX.Element => {
  switch (activeTab) {
    case "movements":
      return <MovementsScreen viewModel={movements} />;
    case "register":
      return <RegisterScreen viewModel={register} />;
    case "account":
      return <AccountScreen viewModel={account} />;
    case "home":
      return <HomeScreen viewModel={home} />;
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

/**
 * Local visual host to navigate between web tab previews.
 */
export const DevPreviewApp = ({
  home,
  movements,
  register,
  account,
}: DevPreviewAppProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("home");

  const activeTabConfig = tabConfig.find((tab) => tab.id === activeTab) ?? { id: "home", label: "Inicio", description: "Balance, cashflow y actividad reciente." };
  const activeSync = resolveSyncModel(activeTab, home, movements, account);
  const navigationMetrics = [
    {
      label: "Disponible",
      value: formatMinorAmount(home.totals.netMinor, home.account.currency),
    },
    {
      label: "Movimientos",
      value: String(movements.items.length),
    },
    {
      label: "Categorias",
      value: String(register.categories.length),
    },
  ];

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
              <strong className={styles.accountName}>{home.account.name}</strong>
            </div>
            <span className={styles.accountCurrency}>{home.account.currency}</span>
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
                  {resolveTabMeta(tab.id, movements, register, account)}
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
              <strong>{home.period.label}</strong>
            </div>
            <div className={styles.topbarMetric}>
              <span>Pendientes</span>
              <strong>{activeSync.pendingOps}</strong>
            </div>
            <div className={styles.topbarMetric}>
              <span>Catalogo</span>
              <strong>{register.categories.length}</strong>
            </div>
          </div>
        </header>

        <section className={styles.viewport}>
          {renderActiveScreen(activeTab, home, movements, register, account)}
        </section>

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
                {resolveTabMeta(tab.id, movements, register, account)}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
