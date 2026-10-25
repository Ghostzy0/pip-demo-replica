/** Main-injected capability scope; renderer query strings cannot select a broader bridge. */
export const NOTES_PRELOAD_ARGUMENT = "--demo-notes-preload";

export function isNotesPreload(argv: readonly string[]): boolean {
	return argv.includes(NOTES_PRELOAD_ARGUMENT);
}

/** Notes uses renderer-local persistence and bundled assets, with no native capabilities. */
export function scopePreloadApi<T extends { assetBaseUrl: string }>(
	api: T,
	argv: readonly string[],
): T | Readonly<Pick<T, "assetBaseUrl">> {
	return isNotesPreload(argv) ? Object.freeze({ assetBaseUrl: api.assetBaseUrl }) : api;
}
