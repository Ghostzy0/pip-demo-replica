import { describe, expect, it, vi } from "vitest";
import { importReplicaVideo } from "./replicaImport";

describe("Replica import ownership", () => {
	it("leaves the project untouched when the picker is cancelled", async () => {
		const append = vi.fn();
		expect(
			await importReplicaVideo({
				projectId: () => null,
				pick: async () => ({ success: false }),
				append,
			}),
		).toBe(false);
		expect(append).not.toHaveBeenCalled();
	});
	it("does not redirect an import into a project selected while the picker was open", async () => {
		let current = "a";
		const append = vi.fn();
		await importReplicaVideo({
			projectId: () => current,
			pick: async () => {
				current = "b";
				return { success: true, path: "/synthetic/clip.mp4" };
			},
			append,
		});
		expect(append).not.toHaveBeenCalled();
	});
	it("passes the accepted file and captured project ownership to the shared write queue", async () => {
		const append = vi.fn().mockResolvedValue(undefined);
		expect(
			await importReplicaVideo({
				projectId: () => "a",
				pick: async () => ({ success: true, path: "/synthetic/clip.mp4" }),
				append,
			}),
		).toBe(true);
		expect(append).toHaveBeenCalledWith("/synthetic/clip.mp4", "clip.mp4", "a");
	});
	it("surfaces append failures instead of reporting a completed import", async () => {
		await expect(
			importReplicaVideo({
				projectId: () => null,
				pick: async () => ({ success: true, path: "/clip.mp4" }),
				append: async () => {
					throw new Error("disk full");
				},
			}),
		).rejects.toThrow("disk full");
	});
});
