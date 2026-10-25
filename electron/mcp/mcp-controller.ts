/** The local recorder/editor edition deliberately exposes no automation listener. */
import type { AiEditionMcpStatus } from "../../src/native/contracts";
import { LOCAL_ONLY_ERROR } from "../demo-policy";
import type { McpSettingsStore } from "./mcp-settings-store";
import type { MediaTools } from "./media-tools";
import type { McpToolDeps, McpToolRunner } from "./openscreen-mcp-server";
export class McpController {
	constructor(
		private readonly store: McpSettingsStore,
		_deps: McpToolDeps,
		_runTool?: McpToolRunner,
		_media?: MediaTools,
	) {}
	async startIfEnabled(): Promise<void> {
		/* Listener excluded from this edition. */
	}
	async stop(): Promise<void> {
		/* No listener was started. */
	}
	async getStatus(): Promise<AiEditionMcpStatus> {
		const { port } = this.store.getSettings();
		return {
			enabled: false,
			port,
			allowEdits: false,
			running: false,
			url: "",
			token: null,
			error: LOCAL_ONLY_ERROR,
		};
	}
	async setEnabled(enabled: boolean): Promise<AiEditionMcpStatus> {
		if (enabled) throw new Error(LOCAL_ONLY_ERROR);
		await this.store.setSettings({ enabled: false });
		return this.getStatus();
	}
	async setPort(_port: number): Promise<AiEditionMcpStatus> {
		throw new Error(LOCAL_ONLY_ERROR);
	}
	async setAllowEdits(_allowEdits: boolean): Promise<AiEditionMcpStatus> {
		throw new Error(LOCAL_ONLY_ERROR);
	}
	async regenerateToken(): Promise<AiEditionMcpStatus> {
		throw new Error(LOCAL_ONLY_ERROR);
	}
}
