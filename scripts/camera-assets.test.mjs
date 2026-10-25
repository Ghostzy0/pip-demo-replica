import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertAsset, CAMERA_PATH, fetchCameraAsset } from "./camera-assets.mjs";

describe("runtime asset integrity", () => {
	it("refuses missing and tampered runtime payloads", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "demo-assets-"));
		const file = path.join(dir, "model");
		try {
			expect(() => assertAsset(file, "bad")).toThrow("missing");
			fs.writeFileSync(file, "valid");
			expect(() => assertAsset(file, "bad")).toThrow("mismatch");
			assertAsset(file, createHash("sha256").update("valid").digest("hex"));
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
	it("does not publish a corrupt camera download", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "demo-camera-"));
		try {
			await expect(
				fetchCameraAsset(dir, async () => ({
					ok: true,
					arrayBuffer: async () => Buffer.from("corrupt"),
				})),
			).rejects.toThrow("checksum");
			expect(fs.existsSync(path.join(dir, CAMERA_PATH))).toBe(false);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});
