// The local editions reject inherited MCP commands before Electron readiness,
// bridge registration, listener startup, or telemetry. No native process is launched.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCAL_ONLY_ERROR } from "../demo-policy";
import { runCli } from "./cliMain";

const mocks = vi.hoisted(() => ({
	userData: "",
	serve: vi.fn(async () => undefined),
	exit: vi.fn(),
	whenReady: vi.fn(async () => undefined),
	registerIpc: vi.fn(() => ({ agentServices: {} })),
	registerStt: vi.fn(),
	isolateSession: vi.fn(),
}));

vi.mock("electron", () => ({
	app: {
		getPath: () => mocks.userData,
		getVersion: () => "2.1.0",
		exit: mocks.exit,
		on: vi.fn(),
		whenReady: mocks.whenReady,
		commandLine: { appendSwitch: vi.fn() },
	},
	BrowserWindow: class {},
	ipcMain: { handle: vi.fn() },
	Menu: { setApplicationMenu: vi.fn(), buildFromTemplate: vi.fn() },
	session: {
		defaultSession: {
			setPermissionCheckHandler: vi.fn(),
			setPermissionRequestHandler: vi.fn(),
			setDisplayMediaRequestHandler: vi.fn(),
		},
	},
	systemPreferences: {},
}));
vi.mock("../install-channel", () => ({ getInstallChannel: () => "nsis" }));
vi.mock("../ipc/handlers", () => ({
	getSelectedDesktopSource: () => null,
	registerIpcHandlers: mocks.registerIpc,
}));
vi.mock("../mcp/hidden-video", () => ({ openVideoInHiddenWindow: vi.fn() }));
vi.mock("../mcp/stdio-server", () => ({ serveMcpOverStdio: mocks.serve }));
vi.mock("../stt", () => ({ registerSttIpc: mocks.registerStt, shutdownStt: vi.fn() }));
vi.mock("../windows", () => ({ createRunnerWindow: vi.fn() }));
vi.mock("./runnerHost", () => ({ createRunnerHost: () => ({}) }));
vi.mock("./sessionData", () => ({ isolateCliSessionData: mocks.isolateSession }));

const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: true }));
const savedConsole = { ...console };
let stdoutWrite: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	mocks.userData = mkdtempSync(path.join(os.tmpdir(), "cli-usage-ping-"));
	mocks.serve.mockClear();
	mocks.exit.mockClear();
	mocks.whenReady.mockClear();
	mocks.registerIpc.mockClear();
	mocks.registerStt.mockClear();
	mocks.isolateSession.mockClear();
	fetchMock.mockClear();
	vi.stubGlobal("fetch", fetchMock);
	vi.stubEnv("DO_NOT_TRACK", "");
	vi.stubEnv("CI", "");
	// The darwin branch touches the dock and menu, which this test is not about.
	vi.spyOn(process, "platform", "get").mockReturnValue("linux");
	// runCli's fatal-error handlers would outlive the test and exit the worker.
	vi.spyOn(process, "on").mockReturnValue(process);
	stdoutWrite = vi.spyOn(process.stdout, "write");
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	Object.assign(console, savedConsole);
	rmSync(mocks.userData, { recursive: true, force: true });
});

function expectRejectedWithoutStartup() {
	const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
	runCli({ kind: "mcp" });
	expect(error).toHaveBeenCalledExactlyOnceWith(LOCAL_ONLY_ERROR);
	expect(mocks.exit).toHaveBeenCalledExactlyOnceWith(1);
	expect(mocks.whenReady).not.toHaveBeenCalled();
	expect(mocks.isolateSession).not.toHaveBeenCalled();
	expect(mocks.registerIpc).not.toHaveBeenCalled();
	expect(mocks.registerStt).not.toHaveBeenCalled();
	expect(mocks.serve).not.toHaveBeenCalled();
	expect(fetchMock).not.toHaveBeenCalled();
	expect(stdoutWrite).not.toHaveBeenCalled();
}

describe("local edition CLI automation boundary", () => {
	it("rejects MCP before any listener, bridge, speech helper or network startup", () => {
		expectRejectedWithoutStartup();
	});
	it("cannot be re-enabled by inherited enabled telemetry or MCP settings", () => {
		writeFileSync(path.join(mocks.userData, "usage-ping.json"), JSON.stringify({ enabled: true }));
		writeFileSync(
			path.join(mocks.userData, "mcp-server.json"),
			JSON.stringify({ enabled: true, allowEdits: true, port: 47821 }),
		);
		expectRejectedWithoutStartup();
	});
	it("fails closed with tracking opt-outs absent and provider credentials present", () => {
		vi.stubEnv("OPENAI_API_KEY", "synthetic-test-credential");
		vi.stubEnv("DO_NOT_TRACK", "0");
		vi.stubEnv("CI", "false");
		expectRejectedWithoutStartup();
	});
});
