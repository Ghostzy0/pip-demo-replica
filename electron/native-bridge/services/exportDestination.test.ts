import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ClipInput } from "../../native/compositor-view/addon";
import {
	assertDestinationPreservesMedia,
	assertExportDestinationPreservesInputs,
} from "./exportDestination";

const directories: string[] = [];
afterEach(() => {
	for (const dir of directories.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function fixture(): { dir: string; original: string; clip: ClipInput } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pip-demo-export-destination-"));
	directories.push(dir);
	const original = path.join(dir, "recording.mp4");
	fs.writeFileSync(original, "original recording");
	return {
		dir,
		original,
		clip: {
			screenPath: original,
			webcamPath: "",
			sourceStartSec: 0,
			sourceEndSec: 1,
			webcamOffsetSec: 0,
		},
	};
}

describe("native export input protection", () => {
	it("rejects replacing the screen recording by its own path", () => {
		const { original, clip } = fixture();
		expect(() => assertExportDestinationPreservesInputs(original, [clip])).toThrow(/source media/);
		expect(fs.readFileSync(original, "utf8")).toBe("original recording");
	});

	it("rejects symlink and hardlink aliases of imported media", () => {
		const { dir, original, clip } = fixture();
		const symlink = path.join(dir, "alias.mp4");
		const hardlink = path.join(dir, "hardlink.mp4");
		fs.symlinkSync(original, symlink);
		fs.linkSync(original, hardlink);
		expect(() => assertExportDestinationPreservesInputs(symlink, [clip])).toThrow(/source media/);
		expect(() => assertExportDestinationPreservesInputs(hardlink, [clip])).toThrow(/source media/);
	});

	it("protects an approved imported recording from a renderer-byte export", () => {
		const { original } = fixture();
		expect(() => assertDestinationPreservesMedia(original, [original])).toThrow(/source media/);
	});

	it("allows a different destination", () => {
		const { dir, clip } = fixture();
		expect(() =>
			assertExportDestinationPreservesInputs(path.join(dir, "render.mp4"), [clip]),
		).not.toThrow();
	});
});
