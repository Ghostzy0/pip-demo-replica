import { EventEmitter } from "node:events";
import type { IpcMain, WebContents } from "electron";
import { describe, expect, it, vi } from "vitest";
import { isBoolean, isCloseChoice, onceFromWebContents } from "./close-confirm";

function fixture() {
	const ipc = new EventEmitter();
	const sender = Object.assign(new EventEmitter(), { id: 7 });
	const reply = vi.fn();
	onceFromWebContents(
		ipc as IpcMain,
		"close",
		sender as unknown as WebContents,
		isCloseChoice,
		reply,
	);
	return { ipc, sender, reply };
}
describe("close confirmation ownership", () => {
	it("ignores a foreign window without consuming the legitimate reply", () => {
		const { ipc, reply } = fixture();
		ipc.emit("close", { sender: { id: 99 } }, "discard");
		expect(reply).not.toHaveBeenCalled();
		ipc.emit("close", { sender: { id: 7 } }, "save");
		expect(reply).toHaveBeenCalledExactlyOnceWith("save");
		expect(ipc.listenerCount("close")).toBe(0);
	});
	it("does not accept malformed replies and consumes a valid reply once", () => {
		const { ipc, reply } = fixture();
		ipc.emit("close", { sender: { id: 7 } }, "maybe");
		ipc.emit("close", { sender: { id: 7 } }, "cancel");
		ipc.emit("close", { sender: { id: 7 } }, "discard");
		expect(reply).toHaveBeenCalledExactlyOnceWith("cancel");
	});
	it("cleans a pending reply when its window is destroyed", () => {
		const { ipc, sender, reply } = fixture();
		sender.emit("destroyed");
		expect(ipc.listenerCount("close")).toBe(0);
		ipc.emit("close", { sender: { id: 7 } }, "discard");
		expect(reply).not.toHaveBeenCalled();
	});
	it("validates save completion as a boolean", () => {
		expect(isBoolean("false")).toBe(false);
		expect(isBoolean(false)).toBe(true);
	});
});
