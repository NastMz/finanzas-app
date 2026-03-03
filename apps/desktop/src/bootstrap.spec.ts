import { describe } from "vitest";

import { runPlatformWrapperBootstrapSmokeTests } from "../../shared/test/platform-wrapper-bootstrap-smoke.spec-helper.js";
import { createDesktopBootstrap } from "./bootstrap.js";

describe("createDesktopBootstrap", () => {
  runPlatformWrapperBootstrapSmokeTests({
    createBootstrap: (options) => createDesktopBootstrap(options),
    defaultDeviceId: "desktop-local-device",
    customDeviceId: "Desktop QA Device 01",
  });
});
