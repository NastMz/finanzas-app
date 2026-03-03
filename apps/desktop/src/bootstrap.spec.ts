import { describe } from "vitest";

import { runSharedInMemoryBootstrapTests } from "../../shared/test/in-memory-bootstrap-shared.spec-helper.js";
import { createDesktopBootstrap } from "./bootstrap.js";

describe("createDesktopBootstrap", () => {
  runSharedInMemoryBootstrapTests({
    createBootstrap: (options) => createDesktopBootstrap(options),
    ulidDeviceId: "Desktop QA 01",
    deterministicDeviceId: "desktop-test-device",
  });
});
