// The MCP settings actions take renderer input, so the bridge checks its types
// before anything reaches the settings store: a bad value is an INVALID_REQUEST,
// not an INTERNAL_ERROR thrown further in.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NativeBridgeResponse } from "../../src/native/contracts";
import { type NativeBridgeContext, registerNativeBridgeHandlers } from "./nativeBridge";

const electron = vi.hoisted(() => ({ handle: vi.fn() }));
vi.mock("electron", () => ({
	app: { getAppPath: () => "", isPackaged: false },
	ipcMain: { handle: electron.handle, removeHandler: vi.fn() },
	shell: {},
}));
vi.mock("../native-bridge/services/compositorViewService", () => ({
	CompositorViewService: class {},
}));

const service = vi.hoisted(() => ({
	mcpSetEnabled: vi.fn(async () => ({ ok: "enabled" })),
	mcpSetPort: vi.fn(async () => ({ ok: "port" })),
	mcpSetAllowEdits: vi.fn(async () => ({ ok: "allowEdits" })),
}));
vi.mock("../native-bridge/services/aiEditionService", () => ({
	AiEditionService: class {
		mcpSetEnabled = service.mcpSetEnabled;
		mcpSetPort = service.mcpSetPort;
		mcpSetAllowEdits = service.mcpSetAllowEdits;
	},
}));

let invoke: (action: string, payload: unknown) => Promise<NativeBridgeResponse>;

beforeEach(() => {
	electron.handle.mockClear();
	for (const fn of Object.values(service)) fn.mockClear();
	registerNativeBridgeHandlers({
		getPlatform: () => "linux",
		getAiEditionDocuments: () => ({}),
		getAiEditionLlmConfig: () => ({}),
	} as unknown as NativeBridgeContext);
	const handler = electron.handle.mock.calls[0]?.[1] as (
		event: unknown,
		request: unknown,
	) => Promise<NativeBridgeResponse>;
	invoke = (action, payload) =>
		handler({ sender: {} }, { domain: "aiEdition", action, payload, requestId: "r" });
});

function errorCode(response: NativeBridgeResponse): string | undefined {
	return response.ok ? undefined : response.error?.code;
}

describe("local edition bridge boundary", () => {
	it.each([
		"mcp.setPort",
		"mcp.setEnabled",
		"mcp.setAllowEdits",
		"mcp.getStatus",
		"llm.getSnapshot",
		"llm.listProviderModels",
		"chat.run",
		"captions.translate",
	])("rejects %s before service/credential access", async (action) => {
		expect(errorCode(await invoke(action, { enabled: true, port: 47821 }))).toBe("UNAVAILABLE");
		for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled();
	});
});
