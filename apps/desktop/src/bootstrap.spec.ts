import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "@finanzas/platform-shared/testing";
import { createDesktopBootstrap } from "./bootstrap.js";

describe("createDesktopBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createDesktopBootstrap(options),
    defaultDeviceId: "desktop-local-device",
    customDeviceId: "Desktop QA Device 01",
  });
});
