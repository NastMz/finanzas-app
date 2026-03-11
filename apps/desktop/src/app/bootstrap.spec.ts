import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "@finanzas/platform-shared/testing";
import { createDesktopBootstrap } from "./bootstrap.js";

describe("createDesktopBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) =>
      createDesktopBootstrap({
        ...options,
        databasePath: ":memory:",
      }),
    defaultDeviceId: "desktop-local-device",
    customDeviceId: "Desktop QA Device 01",
  });

  it("persists entities and outbox state when recreated over the same sqlite file", async () => {
    const databasePath = createTestDatabasePath("desktop");
    const firstBootstrap = createDesktopBootstrap({
      databasePath,
      deviceId: "desktop-sqlite-test",
    });

    const categoryResult = await firstBootstrap.addCategory({
      name: "Salud",
      type: "expense",
    });

    const secondBootstrap = createDesktopBootstrap({
      databasePath,
      deviceId: "desktop-sqlite-test",
    });

    const accountsResult = await secondBootstrap.listAccounts();
    const categoriesResult = await secondBootstrap.listCategories();
    const syncStatus = await secondBootstrap.getSyncStatus();

    expect(accountsResult.accounts.map((account) => account.id)).toEqual(["acc-main"]);
    expect(categoriesResult.categories.map((category) => category.id)).toContain(
      categoryResult.category.id,
    );
    expect(syncStatus.counts.pending).toBe(1);
    expect(syncStatus.cursor).toBe("0");
  });
});

const createTestDatabasePath = (host: string): string =>
  join(
    tmpdir(),
    `finanzas-${host}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`,
  );
