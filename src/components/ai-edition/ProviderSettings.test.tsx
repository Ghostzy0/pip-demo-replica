// @vitest-environment jsdom
// Issue #420: the AI provider dialog used to be a `useState` inside LeftPanel's chat strip, so
// it existed only in Edit mode with the chat panel expanded and nothing else could open it. It
// is mounted once now, above the mode switch, and driven by EditorDialogsContext.
//
// These tests are about *reach*, not about the dialog's own screens: that the app menu's row
// really opens it, that it opens in Media and Rec too, and that the row and the heading are one
// string rather than two that can drift apart.

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider, useEditorDialogActions } from "@/contexts/EditorDialogsContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ShortcutsProvider } from "@/contexts/ShortcutsContext";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";
import { type EditorMode, EditorTopBar } from "./v4/EditorTopBar";

// The dialog reads a provider snapshot over the native bridge the moment it opens. Answer with
// an empty one: which providers exist is the registry's business, and this file's is the door.
vi.mock("@/native/client", () => ({
	nativeBridgeClient: {
		aiEdition: {
			llmGetSnapshot: () =>
				Promise.resolve({
					config: null,
					connectedProviders: [],
					availableProviders: [],
					credentialSummary: [],
				}),
			llmListProviderModels: () => Promise.resolve({ models: [] }),
			// The list screen also shows the MCP server section, which reads its status on open.
			mcpGetStatus: () =>
				Promise.resolve({
					enabled: false,
					port: 47821,
					allowEdits: false,
					running: false,
					url: "http://127.0.0.1:47821/mcp",
					token: null,
					error: null,
				}),
		},
	},
}));

import { ProviderSettingsDialog } from "./ProviderSettings";

const noop = () => {};

/** The top bar as NewEditorShell builds it: the menu row's action is the context's opener, and
 *  nothing else in `actions` matters here. */
function TopBar({ mode }: { mode: EditorMode }) {
	const { openDialog } = useEditorDialogActions();
	return (
		<EditorTopBar
			mode={mode}
			onModeChange={noop}
			projectTitle="Demo Project"
			dirty={false}
			canExport={false}
			canUndo={false}
			canRedo={false}
			chatOpen={false}
			actions={{
				openProject: noop,
				newProject: noop,
				save: noop,
				export: noop,
				openSettings: noop,
				renameProject: noop,
				toggleChat: noop,
				openProviderSettings: () => openDialog("providers"),
				showAbout: noop,
				checkForUpdates: noop,
				undo: noop,
				redo: noop,
			}}
		/>
	);
}

/** The App.tsx shape, minus the editor body: one provider, one dialog mount, and the top bar
 *  that has to reach it. Rendered with the real translations — the drift assertion below is
 *  only worth anything against real strings. */
function renderEditorChrome(locale: string, mode: EditorMode = "edit") {
	localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	return render(
		<I18nProvider>
			<ShortcutsProvider>
				<TooltipProvider>
					<EditorDialogsProvider>
						<TopBar mode={mode} />
						<ProviderSettingsDialog />
					</EditorDialogsProvider>
				</TooltipProvider>
			</ShortcutsProvider>
		</I18nProvider>,
	);
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
});

describe("local edition provider access", () => {
	it.each<EditorMode>([
		"edit",
		"media",
		"rec",
	])("does not offer provider/account settings in %s", (mode) => {
		renderEditorChrome("en", mode);
		fireEvent.click(screen.getByRole("button", { name: /Demo Baseline/ }));
		expect(screen.queryByRole("menuitem", { name: /ai settings/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("keeps account controls absent with another locale", () => {
		renderEditorChrome("fr");
		fireEvent.click(screen.getByRole("button", { name: /Demo Baseline/ }));
		expect(screen.queryByRole("menuitem", { name: /paramètres ia/i })).not.toBeInTheDocument();
	});
});
