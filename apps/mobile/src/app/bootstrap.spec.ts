import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "@finanzas/platform-shared/testing";
import { createMobileBootstrap } from "./bootstrap.js";

describe("createMobileBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createMobileBootstrap(options),
    defaultDeviceId: "mobile-local-device",
    customDeviceId: "Mobile QA Device 01",
  });
});
