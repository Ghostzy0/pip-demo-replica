import { beforeEach, describe, expect, it, vi } from "vitest";
import { type NativeBridgeContext, registerNativeBridgeHandlers } from "./nativeBridge";

const electron = vi.hoisted(() => ({ handle: vi.fn() }));
const project = vi.hoisted(() => ({ loadProjectFileFromPath: vi.fn() }));
vi.mock("electron", () => ({
	BrowserWindow: { fromWebContents: vi.fn() },
	app: { getAppPath: () => "", isPackaged: false },
	ipcMain: { handle: electron.handle, removeHandler: vi.fn() },
	shell: {},
}));
vi.mock("../native-bridge/services/projectService", () => ({
	ProjectService: class {
		loadProjectFileFromPath = project.loadProjectFileFromPath;
	},
}));
vi.mock("../native-bridge/services/aiEditionService", () => ({ AiEditionService: class {} }));
vi.mock("../native-bridge/services/compositorViewService", () => ({
	CompositorViewService: class {},
}));

const sender = { id: 11, mainFrame: { id: "main" } };
let handler: (event: unknown, request: unknown) => Promise<Record<string, unknown>>;

function register(context: Partial<NativeBridgeContext> = {}) {
	electron.handle.mockClear();
	project.loadProjectFileFromPath.mockReset();
	registerNativeBridgeHandlers({
		getPlatform: () => "darwin",
		getAiEditionDocuments: () => ({}),
		getAiEditionLlmConfig: () => ({}),
		...context,
	} as NativeBridgeContext);
	handler = electron.handle.mock.calls[0]?.[1] as typeof handler;
}

function request(path: string) {
	return handler(
		{ sender, senderFrame: sender.mainFrame },
		{
			domain: "project",
			action: "loadProjectFileFromPath",
			requestId: "project-file-test",
			payload: { path },
		},
	);
}

describe("native bridge project path authorization", () => {
	beforeEach(() => register());

	it("rejects arbitrary path loads when no main-process grant authority is configured", async () => {
		await expect(request("/private/secret.openscreen")).resolves.toMatchObject({
			ok: false,
			error: { code: "UNAVAILABLE" },
		});
		expect(project.loadProjectFileFromPath).not.toHaveBeenCalled();
	});

	it("uses only the canonical path authorized for the requesting sender and main frame", async () => {
		const authorizeProjectFilePathLoad = vi.fn(
			(requestingSender, requestingFrame, requestedPath) =>
				requestingSender === sender &&
				requestingFrame === sender.mainFrame &&
				requestedPath === "/safe/drop-alias.openscreen"
					? "/safe/project.openscreen"
					: null,
		);
		register({ authorizeProjectFilePathLoad });
		project.loadProjectFileFromPath.mockResolvedValue({
			success: true,
			path: "/safe/project.openscreen",
		});
		await expect(request("/safe/drop-alias.openscreen")).resolves.toMatchObject({
			ok: true,
			data: { success: true, path: "/safe/project.openscreen" },
		});
		expect(project.loadProjectFileFromPath).toHaveBeenCalledWith("/safe/project.openscreen");
	});

	it("does not call project loading when the sender or path lacks a grant", async () => {
		const authorizeProjectFilePathLoad = vi.fn(() => null);
		register({ authorizeProjectFilePathLoad });
		await expect(request("/private/secret.openscreen")).resolves.toMatchObject({ ok: false });
		expect(authorizeProjectFilePathLoad).toHaveBeenCalledWith(
			sender,
			sender.mainFrame,
			"/private/secret.openscreen",
		);
		expect(project.loadProjectFileFromPath).not.toHaveBeenCalled();
	});
});
