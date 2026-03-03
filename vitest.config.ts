import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["packages/**/*.spec.ts"],
  },
  resolve: {
    alias: {
      "@finanzas/domain": resolve(currentDirectory, "packages/domain/src/index.ts"),
      "@finanzas/application": resolve(currentDirectory, "packages/application/src/index.ts"),
      "@finanzas/data": resolve(currentDirectory, "packages/data/src/index.ts"),
      "@finanzas/sync": resolve(currentDirectory, "packages/sync/src/index.ts"),
    },
  },
});
