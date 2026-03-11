import { indexedDB as fakeIndexedDb } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "@finanzas/platform-shared/testing";
import { createWebBootstrap } from "./bootstrap.js";

describe("createWebBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createWebBootstrap(options),
    defaultDeviceId: "web-local-device",
    customDeviceId: "Web QA Device 01",
  });

  it("persists entities and outbox state across recreated web bootstraps", async () => {
    const databaseName = `finanzas-web-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const firstBootstrap = createWebBootstrap({
      indexedDb: fakeIndexedDb,
      databaseName,
      deviceId: "web-indexeddb-test",
    });

    const categoryResult = await firstBootstrap.addCategory({
      name: "Servicios",
      type: "expense",
    });

    const secondBootstrap = createWebBootstrap({
      indexedDb: fakeIndexedDb,
      databaseName,
      deviceId: "web-indexeddb-test",
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
