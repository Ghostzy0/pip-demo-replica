import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	loadUsagePingState,
	periodKeys,
	planUsagePing,
	sendUsagePing,
	setUsagePingEnabled,
	type UsagePingFacts,
	type UsagePingState,
} from "./usage-ping";

const temps: string[] = [];

afterEach(() => {
	for (const dir of temps) rmSync(dir, { recursive: true, force: true });
	temps.length = 0;
});

function tmp(): string {
	const dir = mkdtempSync(path.join(os.tmpdir(), "usage-ping-"));
	temps.push(dir);
	return dir;
}

const fresh: UsagePingState = { enabled: true, day: null, week: null, month: null };
const facts: UsagePingFacts = {
	version: "2.0.0",
	os: "win32",
	arch: "x64",
	channel: "store",
	surface: "app",
};
// Wednesday 14 October 2026.
const wednesday = new Date("2026-10-14T09:00:00Z");

describe("periodKeys", () => {
	it("uses UTC and ISO weeks, which belong to the year of their Thursday", () => {
		expect(periodKeys(wednesday)).toEqual({
			day: "2026-10-14",
			week: "2026-W42",
			month: "2026-10",
		});
		expect(periodKeys(new Date("2027-01-01T12:00:00Z")).week).toBe("2026-W53");
		expect(periodKeys(new Date("2026-01-01T12:00:00Z")).week).toBe("2026-W01");
	});
});

describe("local edition telemetry", () => {
	it("cannot be enabled by a persisted setting or environment", async () => {
		const dir = tmp();
		setUsagePingEnabled(dir, true);
		expect(loadUsagePingState(dir).enabled).toBe(false);
		expect(planUsagePing(fresh, "store", {}, wednesday)).toBeNull();
		let sent = false;
		await sendUsagePing(dir, facts, {}, wednesday, async () => {
			sent = true;
			return { ok: true };
		});
		expect(sent).toBe(false);
	});
});
