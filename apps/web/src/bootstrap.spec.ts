import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "../../../packages/platform/platform-shared/src/platform-wrapper-bootstrap-smoke.test-helper.js";
import { createWebBootstrap } from "./bootstrap.js";

describe("createWebBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createWebBootstrap(options),
    defaultDeviceId: "web-local-device",
    customDeviceId: "Web QA Device 01",
  });
});
