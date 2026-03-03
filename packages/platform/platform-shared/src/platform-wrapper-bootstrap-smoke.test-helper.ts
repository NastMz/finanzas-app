import type { AddAccountInput } from "@finanzas/application";
import type { InMemoryBootstrap } from "@finanzas/platform-shared";
import { expect, it } from "vitest";

interface BootstrapCreationOptions {
  deviceId?: string;
}

export interface PlatformWrapperBootstrapSmokeTestsOptions {
  createBootstrap(options?: BootstrapCreationOptions): InMemoryBootstrap;
  defaultDeviceId: string;
  customDeviceId: string;
}

const ULID_PATTERN = "[0-9A-HJKMNP-TV-Z]{26}";

/**
 * Registers smoke tests for platform wrappers that delegate to the shared bootstrap.
 */
export const runPlatformWrapperBootstrapSmokeTests = (
  options: PlatformWrapperBootstrapSmokeTestsOptions,
): void => {
  it("uses default device id namespace when not overridden", async () => {
    const app = options.createBootstrap();
    const normalizedDeviceId = normalizeSegment(options.defaultDeviceId);
    const accountResult = await app.addAccount(createAccountInputFixture());

    expect(accountResult.account.id).toMatch(
      new RegExp(`^acc-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(accountResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
  });

  it("allows overriding device id namespace", async () => {
    const app = options.createBootstrap({
      deviceId: options.customDeviceId,
    });
    const normalizedDeviceId = normalizeSegment(options.customDeviceId);
    const accountResult = await app.addAccount(
      createAccountInputFixture({
        name: "Cuenta custom",
      }),
    );

    expect(accountResult.account.id).toMatch(
      new RegExp(`^acc-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
    expect(accountResult.outboxOpId).toMatch(
      new RegExp(`^op-${normalizedDeviceId}-${ULID_PATTERN}$`),
    );
  });
};

const createAccountInputFixture = (
  overrides: Partial<AddAccountInput> = {},
): AddAccountInput => ({
  name: "Cuenta pruebas",
  type: "cash",
  currency: "COP",
  ...overrides,
});

const normalizeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "id";
