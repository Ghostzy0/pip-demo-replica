import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { atomicWriteUserFile } from "./atomicUserFile";

const directories: string[] = [];
afterEach(async () => {
	vi.restoreAllMocks();
	await Promise.all(
		directories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
	);
});

async function temporaryDirectory(): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pip-demo-atomic-user-file-"));
	directories.push(dir);
	return dir;
}

describe("atomic user file publication", () => {
	it("replaces an existing export only after its replacement is complete", async () => {
		const dir = await temporaryDirectory();
		const target = path.join(dir, "video.mp4");
		await fs.writeFile(target, "old complete export");
		await atomicWriteUserFile(target, Buffer.from("new complete export"));
		expect(await fs.readFile(target, "utf8")).toBe("new complete export");
		expect(await fs.readdir(dir)).toEqual(["video.mp4"]);
	});

	it("keeps the previous project and removes the stage when publication fails", async () => {
		const dir = await temporaryDirectory();
		const target = path.join(dir, "project.openscreen");
		await fs.writeFile(target, "previous valid project");
		vi.spyOn(fs, "rename").mockRejectedValue(
			Object.assign(new Error("denied"), { code: "EACCES" }),
		);
		await expect(atomicWriteUserFile(target, "replacement project")).rejects.toThrow("denied");
		expect(await fs.readFile(target, "utf8")).toBe("previous valid project");
		expect(await fs.readdir(dir)).toEqual(["project.openscreen"]);
	});

	it("does not follow a symlink to an imported recording", async () => {
		const dir = await temporaryDirectory();
		const original = path.join(dir, "recording.mp4");
		const target = path.join(dir, "export.mp4");
		await fs.writeFile(original, "original recording");
		await fs.symlink(original, target);
		await atomicWriteUserFile(target, "exported video");
		expect(await fs.readFile(original, "utf8")).toBe("original recording");
		expect(await fs.readFile(target, "utf8")).toBe("exported video");
	});
});
