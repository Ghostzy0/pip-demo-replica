import fs from "node:fs";
import path from "node:path";
import type { ClipInput } from "../../native/compositor-view/addon";

function comparablePath(filePath: string): string {
	let resolved = path.resolve(filePath);
	try {
		resolved = fs.realpathSync.native(resolved);
	} catch {
		// The export target normally does not exist yet. Resolve its parent so a
		// symlinked output directory still compares against imported media.
		try {
			resolved = path.join(fs.realpathSync.native(path.dirname(resolved)), path.basename(resolved));
		} catch {
			// The native export will report a missing or inaccessible directory.
		}
	}
	return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function sceneAudioPaths(sceneJson?: string): string[] {
	if (!sceneJson) return [];
	let scene: Record<string, unknown>;
	try {
		scene = JSON.parse(sceneJson) as Record<string, unknown>;
	} catch {
		// The compositor will reject malformed scene JSON before publishing output.
		return [];
	}
	const tracks = Array.isArray(scene?.audioTracks) ? scene.audioTracks : [];
	const clickSound = scene?.clickSound as Record<string, unknown> | undefined;
	return [
		...tracks.map((track) => (track as { path?: unknown })?.path),
		clickSound?.downPath,
		clickSound?.upPath,
	].filter((item): item is string => typeof item === "string");
}

/** A successful export must never replace source video or audio. */
export function assertExportDestinationPreservesInputs(
	target: string,
	clips: ClipInput[],
	sceneJson?: string,
	extraSources: string[] = [],
): void {
	assertDestinationPreservesMedia(target, [
		...clips.flatMap((clip) => [clip.screenPath, clip.webcamPath]),
		...sceneAudioPaths(sceneJson),
		...extraSources,
	]);
}

/** Also used by the renderer-byte export path, whose media approvals live in IPC. */
export function assertDestinationPreservesMedia(target: string, sources: Iterable<string>): void {
	const destination = comparablePath(target);
	let targetStat: fs.Stats | undefined;
	try {
		targetStat = fs.statSync(target);
	} catch {
		// New destination.
	}
	for (const source of sources) {
		if (!source) continue;
		if (destination === comparablePath(source)) {
			throw new Error("Export destination is one of the source media files.");
		}
		if (targetStat) {
			try {
				const sourceStat = fs.statSync(source);
				if (targetStat.dev === sourceStat.dev && targetStat.ino === sourceStat.ino) {
					throw new Error("Export destination is one of the source media files.");
				}
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
			}
		}
	}
}
