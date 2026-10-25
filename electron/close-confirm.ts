import type { IpcMain, IpcMainEvent, WebContents } from "electron";

/** Consume only a valid reply from the requesting window; teardown cancels the wait. */
export function onceFromWebContents<T>(
	ipc: Pick<IpcMain, "on" | "removeListener">,
	channel: string,
	sender: Pick<WebContents, "id" | "once" | "removeListener">,
	valid: (value: unknown) => value is T,
	reply: (value: T) => void,
): () => void {
	const cleanup = () => {
		ipc.removeListener(channel, listener);
		sender.removeListener("destroyed", cleanup);
	};
	const listener = (event: IpcMainEvent, value: unknown) => {
		if (event.sender.id !== sender.id || !valid(value)) return;
		cleanup();
		reply(value);
	};
	ipc.on(channel, listener);
	sender.once("destroyed", cleanup);
	return cleanup;
}

export function isCloseChoice(value: unknown): value is "save" | "discard" | "cancel" {
	return value === "save" || value === "discard" || value === "cancel";
}
export function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean";
}
