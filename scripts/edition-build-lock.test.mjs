import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withEditionBuildLock } from "./edition-build-lock.mjs";

const helperUrl = new URL("./edition-build-lock.mjs", import.meta.url).href;
const attemptFromAnotherProcess = (root, edition) =>
	spawnSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			`import { withEditionBuildLock } from ${JSON.stringify(helperUrl)};
withEditionBuildLock(process.argv[1], process.argv[2], () => process.stdout.write("acquired"));`,
			root,
			edition,
		],
		{ encoding: "utf8", timeout: 5000 },
	);

function withBuildRoot(body) {
	const root = mkdtempSync(path.join(tmpdir(), "pip-demo-edition-lock-"));
	try {
		return body(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

describe("edition build lock", () => {
	it("refuses a Pip build in another process while baseline owns the shared output", () => {
		withBuildRoot((root) => {
			withEditionBuildLock(root, "baseline", () => {
				const competing = attemptFromAnotherProcess(root, "pip");
				expect(competing.error).toBeUndefined();
				expect(competing.status).not.toBe(0);
				expect(competing.stdout).not.toContain("acquired");
				expect(competing.stderr).toContain("Another edition build is in progress: baseline");
			});

			const afterRelease = attemptFromAnotherProcess(root, "pip");
			expect(afterRelease.status, afterRelease.stderr).toBe(0);
			expect(afterRelease.stdout).toBe("acquired");
			expect(existsSync(path.join(root, ".demo-build", "edition-build.lock"))).toBe(false);
		});
	});

	it("removes its lock when a build command fails", () => {
		withBuildRoot((root) => {
			expect(() =>
				withEditionBuildLock(root, "baseline", () => {
					throw new Error("build failed");
				}),
			).toThrow("build failed");
			expect(attemptFromAnotherProcess(root, "pip").status).toBe(0);
		});
	});
});
