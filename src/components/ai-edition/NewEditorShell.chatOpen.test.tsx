// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
import { useChatPromptBus } from "@/lib/ai-edition/store/useChatPromptBus";

vi.mock("@/contexts/ShortcutsContext", async () => {
	const { DEFAULT_SHORTCUTS } = await import("@/lib/shortcuts");
	return {
		useShortcuts: () => ({
			shortcuts: DEFAULT_SHORTCUTS,
			isMac: false,
			isConfigOpen: false,
			openConfig: vi.fn(),
			closeConfig: vi.fn(),
			setShortcuts: vi.fn(),
			persistShortcuts: () => Promise.resolve(true),
		}),
	};
});

vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({
		locale: "en",
		setLocale: () => {},
	}),
	useScopedT: (scope: string) => (key: string) => `${scope}.${key}`,
}));

vi.mock("./LeftPanel", () => ({
	ChatStripPanel: () => {
		const pending = useChatPromptBus((s) => s.pending);
		const consume = useChatPromptBus((s) => s.consume);
		return (
			<div data-testid="chat-strip-panel">
				{pending ? (
					<button type="button" data-testid="consume-prompt-btn" onClick={() => consume()}>
						send:{pending}
					</button>
				) : null}
			</div>
		);
	},
}));

import { NewEditorShell } from "./NewEditorShell";

function renderShell() {
	return render(
		<TooltipProvider>
			<EditorDialogsProvider>
				<NewEditorShell />
			</EditorDialogsProvider>
		</TooltipProvider>,
	);
}

describe("NewEditorShell chatOpen behavior with useChatPromptBus", () => {
	beforeEach(() => {
		useChatPromptBus.setState({ pending: null });
		(window as unknown as { electronAPI?: unknown }).electronAPI = {
			onAiEditionChatEvent: () => () => {},
			setTitleBarOverlay: () => {},
			setHasUnsavedChanges: () => {},
			onRequestCloseConfirm: () => () => {},
			onRequestSaveBeforeClose: () => () => {},
			sendCloseConfirmResponse: () => {},
			findRecordingCamera: () => Promise.resolve(null),
			preparePreviewAudioTrack: () => Promise.resolve(null),
		};
		Element.prototype.scrollTo = () => {};
		(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = class {
			observe() {
				// noop
			}
			unobserve() {
				// noop
			}
			disconnect() {
				// noop
			}
		};
	});

	afterEach(() => {
		cleanup();
		useChatPromptBus.setState({ pending: null });
		(window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
	});

	it("keeps cloud chat absent even when a stale command submits a prompt", () => {
		renderShell();
		expect(
			screen.queryByRole("button", { name: "editor.topbar.toggleChatPanel" }),
		).not.toBeInTheDocument();
		act(() => useChatPromptBus.getState().submit("smart cut prompt"));
		expect(
			screen.queryByRole("complementary", { name: "editor.shell.aiEditor" }),
		).not.toBeInTheDocument();
		expect(screen.queryByTestId("chat-strip-panel")).not.toBeInTheDocument();
	});
});
