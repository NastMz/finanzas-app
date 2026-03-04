import type { LoadHomeTabInput } from "@finanzas/ui";
import { createRoot } from "react-dom/client";

import { HomeScreen } from "./home-screen.js";
import { webCommands, webQueries, webUi } from "./main.js";
import "./ui/foundations/global.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Missing #app container.");
}

await seedPreviewData();

const homeInput = buildCurrentMonthInput(new Date());
const homeViewModel = await webUi.loadHomeTab(homeInput);

createRoot(rootElement).render(<HomeScreen viewModel={homeViewModel} />);

async function seedPreviewData(): Promise<void> {
  const existingTransactions = await webQueries.listTransactions({
    accountId: "acc-main",
    limit: 1,
  });

  if (existingTransactions.transactions.length > 0) {
    return;
  }

  const foodCategory = await webCommands.addCategory({
    name: "Comida",
    type: "expense",
  });
  const transportCategory = await webCommands.addCategory({
    name: "Transporte",
    type: "expense",
  });

  await webCommands.addTransaction({
    accountId: "acc-main",
    amountMinor: -120000,
    currency: "COP",
    categoryId: foodCategory.category.id,
    date: new Date("2026-03-03T12:00:00.000Z"),
    note: "Mercado semanal",
  });

  await webCommands.addTransaction({
    accountId: "acc-main",
    amountMinor: -35000,
    currency: "COP",
    categoryId: transportCategory.category.id,
    date: new Date("2026-03-02T08:30:00.000Z"),
    note: "Taxi oficina",
  });

  await webCommands.addTransaction({
    accountId: "acc-main",
    amountMinor: 250000,
    currency: "COP",
    categoryId: "income",
    date: new Date("2026-03-01T09:00:00.000Z"),
    note: "Reembolso",
  });
}

function buildCurrentMonthInput(now: Date): LoadHomeTabInput {
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );

  return {
    accountId: "acc-main",
    period: {
      from,
      to,
      label: `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`,
    },
  };
}
