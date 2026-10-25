import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_PROFILE } from "@/lib/demoProfile";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe("compiled product identity", () => {
	it("uses the build-time profile name in every permission locale and preserves project extensions", async () => {
		const name = DEMO_PROFILE.productName;
		const { translate, getAvailableLocales } = await import("../loader");
		const { mainT, setMainLocale } = await import("../../../../electron/i18n");
		// Transform dictionary copy before interpolation, preserving runtime user values.
		expect(
			translate("en", "common", "updates.current", { currentVersion: "OpenScreen" }),
		).toContain("OpenScreen");
		expect(
			translate("en", "common", "updates.current", { currentVersion: "OpenScreen" }),
		).toContain(name);
		for (const locale of getAvailableLocales()) {
			expect(translate(locale, "launch", "permissions.title")).toContain(name);
			expect(translate(locale, "launch", "permissions.help.screenSettings")).toContain(name);
			setMainLocale(locale);
			expect(mainT("common", "actions.about")).toContain(name);
			expect(mainT("common", "updates.current", { currentVersion: "OpenScreen" })).toContain(
				"OpenScreen",
			);
			expect(
				translate(locale, "editor", "emptyState.dropErrors.unsupportedFormatMessage"),
			).toContain(".openscreen");
		}
	});
});
