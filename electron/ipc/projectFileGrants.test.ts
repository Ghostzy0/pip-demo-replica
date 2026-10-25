import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	createProjectFileAuthority,
	isExactCliProjectPath,
	isTrustedProjectSender,
	ProjectFileGrantStore,
} from "./projectFileGrants";

const roots: string[] = [];
function fixture() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "demo-project-grant-"));
	roots.push(root);
	const projects = path.join(root, "projects");
	const outside = path.join(root, "outside");
	fs.mkdirSync(projects);
	fs.mkdirSync(outside);
	const insideFile = path.join(projects, "inside.openscreen");
	const outsideFile = path.join(outside, "outside.openscreen");
	fs.writeFileSync(insideFile, "{}\n");
	fs.writeFileSync(outsideFile, "{}\n");
	return { root, projects, outside, insideFile, outsideFile };
}

function fakeWindow(id: number, windowType: string) {
	const mainFrame = { id: `frame-${id}` };
	const webContents = {
		id,
		mainFrame,
		getURL: () => `file:///app/index.html?windowType=${windowType}`,
	};
	return { window: { webContents, isDestroyed: () => false }, webContents, mainFrame };
}

afterEach(() => {
	for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("ProjectFileGrantStore", () => {
	it("allows one exact file-drop grant for its sender and returns the canonical path", () => {
		const { insideFile } = fixture();
		const grants = new ProjectFileGrantStore();
		expect(grants.grant(11, insideFile)).toBe(true);
		expect(grants.consume(11, insideFile)).toBe(fs.realpathSync.native(insideFile));
		expect(grants.consume(11, insideFile)).toBeNull();
	});

	it("denies Notes, unknown senders, and arbitrary paths without consuming the editor grant", () => {
		const { insideFile, outsideFile } = fixture();
		const grants = new ProjectFileGrantStore();
		expect(grants.grant(11, insideFile)).toBe(true);
		expect(isTrustedProjectSender(22, 11)).toBe(false); // Notes/other WebContents
		expect(isTrustedProjectSender(33, 11)).toBe(false); // unknown WebContents
		expect(isTrustedProjectSender(11, 11, false)).toBe(false); // trusted WebContents, untrusted frame
		expect(grants.consume(22, insideFile)).toBeNull();
		expect(grants.consume(33, insideFile)).toBeNull();
		expect(grants.consume(11, outsideFile)).toBeNull();
		expect(grants.consume(11, insideFile)).toBe(fs.realpathSync.native(insideFile));
	});

	it("does not let a symlink alias substitute for the dropped path", () => {
		const { root, insideFile } = fixture();
		const alias = path.join(root, "alias.openscreen");
		fs.symlinkSync(insideFile, alias);
		const grants = new ProjectFileGrantStore();
		expect(grants.grant(11, alias)).toBe(true);
		expect(grants.consume(11, insideFile)).toBeNull();
		expect(grants.consume(11, alias)).toBe(fs.realpathSync.native(insideFile));
	});

	it("rejects a dropped symlink if it changes target before consumption", () => {
		const { root, projects, outsideFile } = fixture();
		const alias = path.join(root, "alias.openscreen");
		const original = path.join(projects, "original.openscreen");
		fs.writeFileSync(original, "{}\n");
		fs.symlinkSync(original, alias);
		const grants = new ProjectFileGrantStore();
		expect(grants.grant(11, alias)).toBe(true);
		fs.unlinkSync(alias);
		fs.symlinkSync(outsideFile, alias);
		expect(grants.consume(11, alias)).toBeNull();
	});

	it("expires grants and clears them when the sender is destroyed", () => {
		const { insideFile } = fixture();
		const grants = new ProjectFileGrantStore();
		expect(grants.grant(11, insideFile, 100)).toBe(true);
		expect(grants.consume(11, insideFile, 30_100)).toBeNull();
		expect(grants.grant(11, insideFile, 40_000)).toBe(true);
		grants.clearSender(11);
		expect(grants.consume(11, insideFile, 40_001)).toBeNull();
	});

	it("limits renderer CLI authority to the exact main-process project argument", () => {
		const { insideFile, outsideFile } = fixture();
		expect(isExactCliProjectPath(insideFile, insideFile)).toBe(true);
		expect(isExactCliProjectPath(outsideFile, insideFile)).toBe(false);
		expect(isExactCliProjectPath(insideFile, null)).toBe(false);
	});
});

describe("createProjectFileAuthority", () => {
	it("authorizes only the current editor main frame and consumes its drop grant once", () => {
		const { insideFile } = fixture();
		const editor = fakeWindow(101, "editor");
		const notes = fakeWindow(102, "notes");
		const unknown = fakeWindow(103, "editor");
		const grants = new ProjectFileGrantStore();
		const authority = createProjectFileAuthority(() => editor.window, null, grants);

		expect(authority.grantDropFile(notes.webContents, notes.mainFrame, insideFile)).toBe(false);
		expect(authority.grantDropFile(unknown.webContents, unknown.mainFrame, insideFile)).toBe(false);
		expect(authority.grantDropFile(editor.webContents, {}, insideFile)).toBe(false);
		expect(
			authority.authorizeLoadPath(editor.webContents, editor.mainFrame, insideFile),
		).toBeNull();

		expect(authority.grantDropFile(editor.webContents, editor.mainFrame, insideFile)).toBe(true);
		expect(authority.authorizeLoadPath(editor.webContents, editor.mainFrame, insideFile)).toBe(
			fs.realpathSync.native(insideFile),
		);
		expect(
			authority.authorizeLoadPath(editor.webContents, editor.mainFrame, insideFile),
		).toBeNull();
	});

	it("authorizes the exact parsed CLI project path only from its matching main window", () => {
		const { insideFile, outsideFile } = fixture();
		const cli = fakeWindow(201, "cli-export");
		const otherCli = fakeWindow(202, "cli-captions");
		const authority = createProjectFileAuthority(
			() => cli.window,
			{ kind: "export", projectPath: insideFile },
			new ProjectFileGrantStore(),
		);

		expect(authority.authorizeLoadPath(cli.webContents, cli.mainFrame, insideFile)).toBe(
			path.resolve(insideFile),
		);
		expect(authority.authorizeLoadPath(cli.webContents, cli.mainFrame, outsideFile)).toBeNull();
		expect(
			authority.authorizeLoadPath(otherCli.webContents, otherCli.mainFrame, insideFile),
		).toBeNull();
		expect(authority.authorizeLoadPath(cli.webContents, {}, insideFile)).toBeNull();
	});
});
