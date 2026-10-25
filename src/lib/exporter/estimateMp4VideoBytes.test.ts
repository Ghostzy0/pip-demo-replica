import { describe, expect, it } from "vitest";
import { estimateMp4VideoBytes } from "./estimateMp4VideoBytes";

describe("estimateMp4VideoBytes", () => {
	it("uses speed-adjusted output frames and the requested video bitrate", () => {
		// 1000 frames at 25 fps = 40 output seconds; 8 Mbit/s = 40 MB.
		expect(estimateMp4VideoBytes(8_000_000, 1000, 25)).toBe(40_000_000);
	});

	it.each([
		[undefined, 100, 30],
		[0, 100, 30],
		[8_000_000, 0, 30],
		[8_000_000, 100, 0],
		[Number.NaN, 100, 30],
		[8_000_000, Number.POSITIVE_INFINITY, 30],
	])("returns null for invalid export inputs %j", (bitrate, frames, fps) => {
		expect(estimateMp4VideoBytes(bitrate, frames, fps)).toBeNull();
	});
});
