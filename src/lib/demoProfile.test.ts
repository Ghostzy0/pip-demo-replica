import { describe, expect, it } from "vitest";
import {
	PLUS_FEATURES_ENABLED as MAIN_PLUS,
	DEMO_PROFILE as MAIN_PROFILE,
} from "../../electron/demo-policy";
import { DEMO_PROFILE, PLUS_FEATURES_ENABLED } from "./demoProfile";

describe("compiled Demo profile", () => {
	it("uses the exact same build identity and extras flag in main and renderer", () => {
		expect(MAIN_PROFILE).toEqual(DEMO_PROFILE);
		expect(MAIN_PLUS).toBe(PLUS_FEATURES_ENABLED);
		expect(PLUS_FEATURES_ENABLED).toBe(DEMO_PROFILE.extras === "plus");
	});
});
