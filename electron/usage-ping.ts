import type { InstallChannel } from "./install-channel";
export const USAGE_PING_INTERVAL_MS = 6 * 60 * 60 * 1000;
export interface UsagePingState {
	enabled: boolean;
	day: string | null;
	week: string | null;
	month: string | null;
}
export interface UsagePingFacts {
	version: string;
	os: NodeJS.Platform;
	arch: string;
	channel: InstallChannel;
	surface: "app" | "mcp";
}

/** An environment flag counts as set unless it is empty, "0" or "false": `CI=false` is off. */
const isSet = (value: string | undefined) =>
	value !== undefined && !["", "0", "false"].includes(value.toLowerCase());

/** The usual opt-out convention (consoledonottrack.com). */
export function doNotTrack(env: Readonly<Record<string, string | undefined>>): boolean {
	return isSet(env.DO_NOT_TRACK);
}

/** UTC, so the flags fall in the same buckets as PostHog's UTC days. */
export function periodKeys(now: Date): { day: string; week: string; month: string } {
	const iso = now.toISOString();
	// ISO 8601 week: the week belongs to the year of its Thursday.
	const thursday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
	const year = thursday.getUTCFullYear();
	const week = Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
	return {
		day: iso.slice(0, 10),
		week: `${year}-W${String(week).padStart(2, "0")}`,
		month: iso.slice(0, 7),
	};
}

/** Compatibility surface for the inherited CLI; telemetry is absent in both editions. */
export function planUsagePing(
	_state: UsagePingState,
	_channel: InstallChannel,
	_env: Readonly<Record<string, string | undefined>>,
	_now: Date,
): null {
	return null;
}
export function loadUsagePingState(_userData: string): UsagePingState {
	return { enabled: false, day: null, week: null, month: null };
}
export function setUsagePingEnabled(_userData: string, _enabled: boolean): void {
	/* Cannot enable telemetry. */
}
type Fetch = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;
export async function sendUsagePing(
	_userData: string,
	_facts: UsagePingFacts,
	_env: Readonly<Record<string, string | undefined>> = process.env,
	_now: Date = new Date(),
	_fetchImpl?: Fetch,
): Promise<void> {
	/* Compatibility shim: no outbound request or file write. */
}
