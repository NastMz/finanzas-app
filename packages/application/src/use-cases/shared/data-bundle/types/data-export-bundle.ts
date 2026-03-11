import { type DATA_BUNDLE_FORMAT, type DATA_BUNDLE_VERSION } from "./constants.js";
import type { DataExportBundleEntities } from "./data-export-bundle-entities.js";

export interface DataExportBundle {
  format: typeof DATA_BUNDLE_FORMAT;
  version: typeof DATA_BUNDLE_VERSION;
  exportedAt: string;
  entities: DataExportBundleEntities;
}
