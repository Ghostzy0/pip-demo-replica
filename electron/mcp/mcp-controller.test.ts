import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DocumentNotFoundError } from "../ai-edition/document-service";
import { McpController } from "./mcp-controller";
import { DEFAULT_MCP_PORT, McpSettingsStore, type McpTokenCrypto } from "./mcp-settings-store";
import type { McpToolDeps } from "./openscreen-mcp-server";

// Reversible and visibly not plaintext, so a test can tell the token was encrypted.
const fakeCrypto: McpTokenCrypto = {
	isEncryptionAvailable: () => true,
	encryptString: (plain) => Buffer.from(`enc:${plain}`),
	decryptString: (encrypted) => encrypted.toString().replace(/^enc:/, ""),
};

const deps: McpToolDeps = {
	transport: "http",
	host: { snapshot: async () => null, apply: async () => "no-editor" },
	projects: {
		listProjects: async () => [],
		getProjectForUpdate: async (id) => {
			throw new DocumentNotFoundError(id);
		},
		projectOpenInEditor: async () => null,
		saveProjectIfUnchanged: async (document) => document,
	},
	editsAllowed: () => true,
	version: "0.0.0",
};

let dir: string;
let controller: McpController | null = null;
let blocker: Server | null = null;

beforeEach(() => {
	dir = mkdtempSync(path.join(os.tmpdir(), "openscreen-mcp-"));
});

afterEach(async () => {
	await controller?.stop();
	controller = null;
	await new Promise<void>((resolve) => (blocker ? blocker.close(() => resolve()) : resolve()));
	blocker = null;
	rmSync(dir, { recursive: true, force: true });
});

describe("McpSettingsStore", () => {
	it("is off by default, on the default port", () => {
		const store = new McpSettingsStore(dir, fakeCrypto);
		expect(store.getSettings()).toEqual({
			enabled: false,
			port: DEFAULT_MCP_PORT,
			allowEdits: false,
		});
	});

	it("keeps MCP edits off unless they were turned on explicitly", async () => {
		expect(new McpSettingsStore(dir, fakeCrypto).getSettings().allowEdits).toBe(false);
		await new McpSettingsStore(dir, fakeCrypto).setSettings({ enabled: true });
		expect(new McpSettingsStore(dir, fakeCrypto).getSettings().allowEdits).toBe(false);
		await new McpSettingsStore(dir, fakeCrypto).setSettings({ allowEdits: true });
		expect(new McpSettingsStore(dir, fakeCrypto).getSettings().allowEdits).toBe(true);
	});

	it("keeps the token encrypted on disk and stable across instances", async () => {
		const token = await new McpSettingsStore(dir, fakeCrypto).getToken();
		expect(readFileSync(path.join(dir, "mcp-token.enc"), "utf8")).toBe(`enc:${token}`);
		expect(await new McpSettingsStore(dir, fakeCrypto).getToken()).toBe(token);
	});

	it("refuses a port outside the unprivileged range", async () => {
		const store = new McpSettingsStore(dir, fakeCrypto);
		await expect(store.setSettings({ port: 80 })).rejects.toThrow(/1024/);
	});

	it("will not mint a token without OS encryption", async () => {
		const store = new McpSettingsStore(dir, { ...fakeCrypto, isEncryptionAvailable: () => false });
		await expect(store.getToken()).rejects.toThrow(/safeStorage/);
	});
});

describe("local edition MCP controller", () => {
	it("never starts or reads credentials, including with a stale enabled setting", async () => {
		const store = new McpSettingsStore(dir, fakeCrypto);
		await store.setSettings({ enabled: true, allowEdits: true });
		const controller = new McpController(store, deps);
		await controller.startIfEnabled();
		expect(await controller.getStatus()).toMatchObject({
			enabled: false,
			running: false,
			allowEdits: false,
			token: null,
			url: "",
		});
		await expect(controller.setEnabled(true)).rejects.toThrow(/local edition/);
		await expect(controller.regenerateToken()).rejects.toThrow(/local edition/);
		await controller.stop();
	});
});
