import { describe, expect, it } from "vitest";
import { getAvailableLocales, translate } from "../loader";

const productCopy = [
	["editor", "topbar.newRecording"],
	["editor", "topbar.importVideo"],
	["editor", "topbar.importingVideo"],
	["editor", "topbar.backToEditor"],
	["editor", "exportDialog.approxSize"],
	["launch", "tooltips.expandHUD"],
	["launch", "tooltips.collapseHUD"],
	["launch", "recording.running"],
	["launch", "recording.paused"],
] as const;

describe("new edition UI copy", () => {
	it("has locale-specific strings for all supported locales", () => {
		for (const locale of getAvailableLocales()) {
			// “File” is a conventional menu label in Italian as well as English.
			const fileLabel = translate(locale, "editor", "topbar.file");
			expect(fileLabel).toBeTruthy();
			for (const [namespace, key] of productCopy) {
				const localized = translate(locale, namespace, key);
				const english = translate("en", namespace, key);
				expect(localized, `${locale}/${namespace}.${key}`).toBeTruthy();
				if (locale !== "en") {
					expect(localized, `${locale}/${namespace}.${key}`).not.toBe(english);
				}
			}
		}
		expect(translate("es", "editor", "topbar.backToEditor")).toBe("Volver al editor");
	});
});
