import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "@finanzas/platform-shared/testing";
import { createWebBootstrap } from "./bootstrap.js";

describe("createWebBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createWebBootstrap(options),
    defaultDeviceId: "web-local-device",
    customDeviceId: "Web QA Device 01",
  });
});
