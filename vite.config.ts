import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@finanzas/domain": resolve(currentDirectory, "packages/domain/src/index.ts"),
      "@finanzas/application": resolve(currentDirectory, "packages/application/src/index.ts"),
      "@finanzas/data": resolve(currentDirectory, "packages/data/src/index.ts"),
      "@finanzas/sync": resolve(currentDirectory, "packages/sync/src/index.ts"),
      "@finanzas/ui/design-system/tokens.css": resolve(
        currentDirectory,
        "packages/ui/src/design-system/tokens.css",
      ),
      "@finanzas/ui/design-system": resolve(
        currentDirectory,
        "packages/ui/src/design-system/index.ts",
      ),
      "@finanzas/ui": resolve(currentDirectory, "packages/ui/src/index.ts"),
      "@finanzas/platform-shared/testing": resolve(
        currentDirectory,
        "packages/platform/platform-shared/src/platform-wrapper-bootstrap-smoke.test-helper.ts",
      ),
      "@finanzas/platform-shared": resolve(
        currentDirectory,
        "packages/platform/platform-shared/src/index.ts",
      ),
    },
  },
});
