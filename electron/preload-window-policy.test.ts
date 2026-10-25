import { describe, expect, it, vi } from "vitest";
import { NOTES_PRELOAD_ARGUMENT, scopePreloadApi } from "./preload-window-policy";

describe("Notes preload capability boundary", () => {
	it("exposes only bundled asset location, with no project, recording, clipboard or generic IPC", () => {
		const full = {
			assetBaseUrl: "file:///bundled-assets/",
			invokeNativeBridge: vi.fn(),
			loadProjectFileFromPath: vi.fn(),
			copyToClipboard: vi.fn(),
			exportStart: vi.fn(),
			startRecording: vi.fn(),
			getPathForFile: vi.fn(),
		};
		const notes = scopePreloadApi(full, ["electron", NOTES_PRELOAD_ARGUMENT]);
		expect(Object.keys(notes)).toEqual(["assetBaseUrl"]);
		expect(Object.isFrozen(notes)).toBe(true);
		expect(notes.assetBaseUrl).toBe(full.assetBaseUrl);
		expect(notes).not.toHaveProperty("invokeNativeBridge");
		expect(notes).not.toHaveProperty("loadProjectFileFromPath");
	});
	it("retains required editor capabilities without a main-injected Notes flag", () => {
		const full = { assetBaseUrl: "file:///bundled-assets/", invokeNativeBridge: vi.fn() };
		expect(scopePreloadApi(full, ["electron", "?showNotes=true"])).toBe(full);
	});
});
