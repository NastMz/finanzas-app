import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "../../../packages/platform/platform-shared/src/platform-wrapper-bootstrap-smoke.spec-helper.js";
import { createWebBootstrap } from "./bootstrap.js";

describe("createWebBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createWebBootstrap(options),
    defaultDeviceId: "web-local-device",
    customDeviceId: "Web QA Device 01",
  });
});
