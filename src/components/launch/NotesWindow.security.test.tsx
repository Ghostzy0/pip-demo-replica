// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import { NotesWindow } from "./NotesWindow";

vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => children,
}));

function noteBody(): HTMLElement {
	const body = document.querySelector<HTMLElement>(".tiptap");
	if (!body) throw new Error("the Notes editor did not mount");
	return body;
}

function renderNotes() {
	return render(
		<I18nProvider>
			<NotesWindow />
		</I18nProvider>,
	);
}

function pasteHtml(html: string) {
	const event = new Event("paste", { bubbles: true, cancelable: true });
	Object.defineProperty(event, "clipboardData", {
		value: {
			types: ["text/html", "text/plain"],
			files: [],
			getData: (type: string) =>
				type === "text/html" ? html : type === "text/plain" ? "safe fallback" : "",
		},
	});
	fireEvent(noteBody(), event);
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("Notes HTML security at the real editor boundary", () => {
	it("sanitizes persisted legacy HTML before Tiptap parses it and keeps supported formatting", () => {
		localStorage.setItem(
			"notes",
			'<p onclick="run()" data-pm-slice="1 1 []"><strong>Bold</strong> and <em>italic</em>' +
				'<img src="x" onerror="run()"><svg onload="run()"><script>run()</script></svg></p>',
		);

		renderNotes();

		expect(noteBody()).toHaveTextContent("Bold and italic");
		expect(noteBody().querySelector("strong")).toHaveTextContent("Bold");
		expect(noteBody().querySelector("em")).toHaveTextContent("italic");
		expect(
			noteBody().querySelector("img, svg, script, [onclick], [onerror], [onload], [data-pm-slice]"),
		).toBeNull();
		expect(localStorage.getItem("notes")).not.toMatch(
			/data-pm-slice|onerror|onclick|<script|<img|<svg/i,
		);
	});

	it("sanitizes pasted ProseMirror slice metadata and unsafe markup, then persists safe formatting", async () => {
		renderNotes();
		pasteHtml(
			'<p data-pm-slice="1 1 [{&quot;type&quot;:&quot;doc&quot;}]" onclick="run()">' +
				"Keep <strong>bold</strong>, <b>semantic bold</b> and <em>italic</em> " +
				'<a href="javascript:run()" style="background:url(javascript:run())">unsafe link</a>' +
				'<img src="x" onerror="run()"><script>run()</script></p>',
		);

		await waitFor(() =>
			expect(noteBody()).toHaveTextContent("Keep bold, semantic bold and italic unsafe link"),
		);
		expect(noteBody().querySelector("strong")).toHaveTextContent("bold");
		expect(noteBody()).toContainHTML("<strong>semantic bold</strong>");
		expect(noteBody().querySelector("em")).toHaveTextContent("italic");
		expect(
			noteBody().querySelector("a, img, script, [onclick], [onerror], [style], [data-pm-slice]"),
		).toBeNull();

		const saved = localStorage.getItem("notes") ?? "";
		expect(saved).toContain("<strong>bold</strong>");
		expect(saved).toContain("<strong>semantic bold</strong>");
		expect(saved).toContain("<em>italic</em>");
		expect(saved).not.toMatch(/data-pm-slice|javascript:|onerror|onclick|<script|<img/i);
	});

	it("reopens persisted editor output with allowed formatting intact", async () => {
		const first = renderNotes();
		pasteHtml("<p>Read <strong>this</strong> <em>carefully</em></p>");
		await waitFor(() => expect(localStorage.getItem("notes")).toContain("<strong>this</strong>"));
		first.unmount();

		renderNotes();
		expect(noteBody()).toHaveTextContent("Read this carefully");
		expect(noteBody().querySelector("strong")).toHaveTextContent("this");
		expect(noteBody().querySelector("em")).toHaveTextContent("carefully");
	});
});
