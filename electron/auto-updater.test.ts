import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	blockedFromInstalling,
	checkForSelfUpdate,
	downloadSelfUpdate,
	type InstallReadiness,
	installSelfUpdate,
} from "./auto-updater";

const mocks = vi.hoisted(() => ({
	// Deliberately initialised to electron-updater's DEFAULTS, so a test asserting they are
	// false proves our configuration ran rather than reading a value that was never touched.
	autoUpdater: {
		autoDownload: true,
		autoInstallOnAppQuit: true,
		logger: {} as unknown,
		checkForUpdates: vi.fn(),
		downloadUpdate: vi.fn(),
		quitAndInstall: vi.fn(),
	},
	app: { isPackaged: true, getVersion: vi.fn(() => "1.9.2") },
}));

vi.mock("electron", () => ({ app: mocks.app }));
vi.mock("electron-updater", () => ({ autoUpdater: mocks.autoUpdater }));

function state(overrides: Partial<InstallReadiness> = {}): InstallReadiness {
	return { recording: false, inApplicationsFolder: true, platform: "linux", ...overrides };
}

describe("blockedFromInstalling", () => {
	it("allows an install when nothing is in the way", () => {
		for (const platform of ["win32", "darwin", "linux"] as const) {
			expect(blockedFromInstalling(state({ platform }))).toBeNull();
		}
	});

	// Quitting mid-recording loses the take. On Windows it is worse than losing it: the capture
	// helpers spawn from inside the install directory, and NSIS cannot overwrite a running .exe.
	it("refuses while a recording is in progress, on every platform", () => {
		for (const platform of ["win32", "darwin", "linux"] as const) {
			expect(blockedFromInstalling(state({ platform, recording: true }))).toBe("recording");
		}
	});

	// App Translocation: a quarantined app runs from a read-only image where Squirrel cannot
	// replace the bundle. Pinned per-platform because CI is Linux-only and an unpinned branch
	// would be green here and wrong on the one platform it applies to.
	it("refuses a macOS install running outside /Applications", () => {
		expect(blockedFromInstalling(state({ platform: "darwin", inApplicationsFolder: false }))).toBe(
			"not-in-applications",
		);
	});

	it("does not apply the Applications-folder rule off macOS", () => {
		for (const platform of ["win32", "linux"] as const) {
			expect(blockedFromInstalling(state({ platform, inApplicationsFolder: false }))).toBeNull();
		}
	});

	it("reports the recording veto first when both apply", () => {
		expect(
			blockedFromInstalling(
				state({ platform: "darwin", recording: true, inApplicationsFolder: false }),
			),
		).toBe("recording");
	});
});

describe("local edition updates", () => {
	it.each([
		"dmg",
		"nsis",
		"appimage",
		"store",
		"dev",
	] as const)("cannot check or replace the %s installation", async (channel) => {
		expect(await checkForSelfUpdate(channel)).toEqual({ kind: "unsupported" });
		expect(await downloadSelfUpdate()).toEqual({ kind: "unsupported" });
		await expect(installSelfUpdate()).rejects.toThrow(/not available/);
		expect(mocks.autoUpdater.checkForUpdates).not.toHaveBeenCalled();
		expect(mocks.autoUpdater.downloadUpdate).not.toHaveBeenCalled();
		expect(mocks.autoUpdater.quitAndInstall).not.toHaveBeenCalled();
	});
});
