/** Browser-only serve must not install Electron's preload watcher: its default reload starts a shell. */
export function includeNativePlugin(
	command: string,
	env: Record<string, string | undefined>,
): boolean {
	return command === "build" || !env.NO_ELECTRON;
}
/** Only the main watcher starts the shell. Preload may refresh an existing live shell. */
export function reloadExistingShell(
	childPid: number | undefined,
	env: Record<string, string | undefined>,
): boolean {
	return !env.NO_ELECTRON && typeof childPid === "number" && childPid > 0;
}
