// In-place updates for the artifacts we build and can replace: NSIS, the macOS .app, AppImage,
// deb, rpm and pacman. Everything else — Microsoft Store, Flathub, Snap, Nix — is filtered out
// before we get here by `platformOwnsUpdates`; see install-channel.ts for why that is a hard
// rule rather than a best effort.
//
// electron-updater replaces the WHOLE payload, not just the JS: the Swift/C++ capture helpers,
// the Rust compositor addon, the ffmpeg libraries and the whisper binaries all ship inside the
// bundle and come along. What does NOT come along is anything under userData — recordings,
// projects, and the ~500 MB STT model — which is exactly what we want.

import type { InstallChannel } from "./install-channel";

export type UpdateOutcome =
	| { kind: "unsupported" }
	| { kind: "current" }
	| { kind: "downloaded"; version: string }
	| { kind: "failed"; error: Error };

/** Reasons an install must not start right now. Kept separate from "can this channel update at
 *  all" because these are transient — the answer changes as the user works. */
export interface InstallReadiness {
	recording: boolean;
	/** macOS only. Gatekeeper runs a quarantined app from a read-only image (App Translocation),
	 *  where Squirrel cannot replace the bundle; worse, an app can BECOME translocated after an
	 *  update and then never update again. */
	inApplicationsFolder: boolean;
	platform: NodeJS.Platform;
}

/** Pure so the veto can be tested without an updater, a Mac, or a recording. */
export function blockedFromInstalling(state: InstallReadiness): string | null {
	if (state.recording) return "recording";
	if (state.platform === "darwin" && !state.inApplicationsFolder) return "not-in-applications";
	return null;
}

/** No upstream updater/feed is present in either Demo distribution. */
export async function checkForSelfUpdate(_channel: InstallChannel): Promise<UpdateOutcome> {
	return { kind: "unsupported" };
}
export async function downloadSelfUpdate(): Promise<UpdateOutcome> {
	return { kind: "unsupported" };
}
export async function installSelfUpdate(): Promise<void> {
	throw new Error("Automatic updates are not available in this edition.");
}
