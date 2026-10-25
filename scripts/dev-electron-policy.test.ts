import { describe, expect, it } from "vitest";
import { includeNativePlugin, reloadExistingShell } from "./dev-electron-policy";

describe("browser-only development isolation", () => {
	it("omits all native startup and preload hooks in browser serve", () => {
		expect(includeNativePlugin("serve", { NO_ELECTRON: "1" })).toBe(false);
		expect(reloadExistingShell(123, { NO_ELECTRON: "1" })).toBe(false);
	});
	it("still compiles main and preload for production builds", () => {
		expect(includeNativePlugin("build", { NO_ELECTRON: "1" })).toBe(true);
	});
	it("preload never starts a shell through the plugin fallback", () => {
		expect(reloadExistingShell(undefined, {})).toBe(false);
		expect(reloadExistingShell(0, {})).toBe(false);
		expect(reloadExistingShell(123, {})).toBe(true);
	});
});
