import { describe, expect, it } from "vitest";
import { permitsAiEditionAction, permitsResourceUrl } from "./demo-policy";

describe("local-only distribution boundaries", () => {
	it.each([
		"document.listProjects",
		"document.get",
		"document.create",
		"document.save",
		"document.delete",
		"document.addAsset",
		"document.removeAsset",
	])("preserves local document action %s", (action) =>
		expect(permitsAiEditionAction(action)).toBe(true));
	it.each([
		"llm.getSnapshot",
		"llm.setConfig",
		"llm.setApiKey",
		"llm.listProviderModels",
		"chat.run",
		"chat.compactNow",
		"mcp.setEnabled",
		"captions.translate",
		"futureNetworkAction",
	])("fails closed for %s", (action) => expect(permitsAiEditionAction(action)).toBe(false));
	it.each([
		"file:///tmp/local.mp4",
		"data:image/png;base64,aGVsbG8=",
		"blob:file:///123",
	])("allows local media %s", (url) => expect(permitsResourceUrl(url)).toBe(true));
	it.each([
		"https://eu.i.posthog.com/i/v0/e/",
		"https://api.openai.com/v1",
		"http://127.0.0.1:1234/",
		"https://example.com/",
		"not a URL",
	])("blocks request %s", (url) => expect(permitsResourceUrl(url)).toBe(false));
	it("limits development resources to the explicitly configured loopback origin", () => {
		const dev = "http://localhost:5173";
		expect(permitsResourceUrl("http://localhost:5173/src/main.tsx", dev)).toBe(true);
		expect(permitsResourceUrl("ws://localhost:5173/", dev)).toBe(true);
		expect(permitsResourceUrl("http://localhost:5174/", dev)).toBe(false);
		expect(permitsResourceUrl("http://localhost.evil:5173/", dev)).toBe(false);
		expect(permitsResourceUrl("http://example.com:5173/", "http://example.com:5173")).toBe(false);
	});
});
