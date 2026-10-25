import type { DemoBuildProfile } from "../../scripts/demo-build-profiles.mjs";

declare const __DEMO_PROFILE__: DemoBuildProfile;

/** One build-time identity object shared by the Electron main and renderer bundles. */
export const DEMO_PROFILE = Object.freeze(__DEMO_PROFILE__);
export const PLUS_FEATURES_ENABLED = DEMO_PROFILE.extras === "plus";
