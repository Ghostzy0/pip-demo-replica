import { describe, expect, it } from "vitest";
import { brandMessages, brandProductText } from "./brand";

describe("edition branding for bundled copy", () => {
	it.each([
		"Demo Baseline",
		"Pip Demo",
	])("names %s in permissions and localized product copy", (name) => {
		expect(brandProductText("Turn on OpenScreen in System Settings.", name)).toBe(
			`Turn on ${name} in System Settings.`,
		);
		expect(brandProductText("OpenScreen'i yeniden başlat", name)).toBe(`${name}'i yeniden başlat`);
		expect(brandProductText("OpenScreen需要權限", name)).toBe(`${name}需要權限`);
		expect(brandProductText("About Openscreen / OPENSCREEN", name)).toBe(`About ${name} / ${name}`);
	});
	it("preserves upstream URLs, project extensions and attribution", () => {
		for (const text of [
			"https://github.com/getopenscreen/OpenScreen/releases/tag/v2.1.2",
			"file:///tmp/OpenScreen/manual.html",
			"Import a .openscreen project or .openscreenpreset file.",
			"OpenScreen contributors — MIT License",
			"Copyright 2025 OpenScreen contributors",
			"© 2025-2026 OpenScreen contributors",
		])
			expect(brandProductText(text, "Pip Demo")).toBe(text);
	});
	it("copies nested dictionaries, preserving keys, interpolation and non-text values", () => {
		const original = {
			OpenScreen: ["OpenScreen {{title}}", { file: ".openscreen", count: 2 }],
			none: null,
		};
		const branded = brandMessages(original, "Demo Baseline");
		expect(branded).toEqual({
			OpenScreen: ["Demo Baseline {{title}}", { file: ".openscreen", count: 2 }],
			none: null,
		});
		expect(original.OpenScreen[0]).toBe("OpenScreen {{title}}");
	});
});
