import { useState } from "react";
import type {
  FinanzasAccountTabViewModel,
  FinanzasHomeTabViewModel,
  FinanzasMovementsTabViewModel,
  FinanzasRegisterTabViewModel,
} from "@finanzas/ui";

import { AccountScreen } from "./account-screen.js";
import { HomeScreen } from "./home-screen.js";
import { MovementsScreen } from "./movements-screen.js";
import { RegisterScreen } from "./register-screen.js";
import { classNames } from "./ui/lib/class-names.js";
import styles from "./dev-preview-app.module.css";

type PreviewTab = "home" | "movements" | "register" | "account";

const tabConfig: Array<{ id: PreviewTab; label: string }> = [
  { id: "home", label: "Inicio" },
  { id: "movements", label: "Movimientos" },
  { id: "register", label: "Registrar" },
  { id: "account", label: "Cuenta" },
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

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <ul className={styles.tabs} role="list">
          {tabConfig.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                className={classNames(
                  styles.tab,
                  activeTab === tab.id ? styles.activeTab : undefined,
                )}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {activeTab === "home" ? <HomeScreen viewModel={home} /> : null}
      {activeTab === "movements" ? <MovementsScreen viewModel={movements} /> : null}
      {activeTab === "register" ? <RegisterScreen viewModel={register} /> : null}
      {activeTab === "account" ? <AccountScreen viewModel={account} /> : null}
    </div>
  );
};
