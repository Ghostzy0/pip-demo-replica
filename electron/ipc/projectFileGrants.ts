import fs from "node:fs";
import path from "node:path";

const PROJECT_EXTENSION = ".openscreen";
const GRANT_TTL_MS = 30_000;
const MAX_GRANTS_PER_SENDER = 8;
const MAX_GRANTS_TOTAL = 64;

interface ProjectFileGrant {
	requestedPath: string;
	canonicalPath: string;
	expiresAt: number;
}

function canonicalProjectFile(
	filePath: unknown,
): { requestedPath: string; canonicalPath: string } | null {
	if (typeof filePath !== "string" || filePath.length === 0 || filePath.includes("\0")) return null;
	try {
		const requestedPath = path.resolve(filePath);
		if (path.extname(requestedPath).toLowerCase() !== PROJECT_EXTENSION) return null;
		const canonicalPath = fs.realpathSync.native(requestedPath);
		if (!fs.statSync(canonicalPath).isFile()) return null;
		return { requestedPath, canonicalPath };
	} catch {
		return null;
	}
}

/** Main-process, sender-bound authority for a native project-file drop. */
export class ProjectFileGrantStore {
	private readonly bySender = new Map<number, Map<string, ProjectFileGrant>>();

	grant(senderId: number, filePath: unknown, now = Date.now()): boolean {
		if (!Number.isSafeInteger(senderId) || senderId <= 0) return false;
		const canonical = canonicalProjectFile(filePath);
		if (!canonical) return false;
		this.expire(now);

		let grants = this.bySender.get(senderId);
		if (!grants) {
			grants = new Map();
			this.bySender.set(senderId, grants);
		}
		// Re-granting the same path replaces the prior one and refreshes its short lifetime.
		grants.delete(canonical.requestedPath);
		grants.set(canonical.requestedPath, {
			...canonical,
			expiresAt: now + GRANT_TTL_MS,
		});
		while (grants.size > MAX_GRANTS_PER_SENDER) {
			const oldest = grants.keys().next().value as string | undefined;
			if (oldest === undefined) break;
			grants.delete(oldest);
		}
		this.trimTotal();
		return true;
	}

	/** Consume only the exact dropped path, and re-resolve it to detect changed symlinks. */
	consume(senderId: number, filePath: unknown, now = Date.now()): string | null {
		if (!Number.isSafeInteger(senderId) || senderId <= 0) return null;
		const requested =
			typeof filePath === "string" && !filePath.includes("\0") ? path.resolve(filePath) : "";
		if (!requested) return null;
		this.expire(now);
		const grants = this.bySender.get(senderId);
		const grant = grants?.get(requested);
		if (!grant) return null;
		// Consume before revalidation so a failed/stat-racing request cannot be replayed.
		grants?.delete(requested);
		if (grants?.size === 0) this.bySender.delete(senderId);
		const current = canonicalProjectFile(filePath);
		if (
			grant.expiresAt <= now ||
			!current ||
			current.requestedPath !== grant.requestedPath ||
			current.canonicalPath !== grant.canonicalPath
		) {
			return null;
		}
		return grant.canonicalPath;
	}

	clearSender(senderId: number): void {
		this.bySender.delete(senderId);
	}

	private expire(now: number): void {
		for (const [senderId, grants] of this.bySender) {
			for (const [requestedPath, grant] of grants) {
				if (grant.expiresAt <= now) grants.delete(requestedPath);
			}
			if (grants.size === 0) this.bySender.delete(senderId);
		}
	}

	private trimTotal(): void {
		let total = [...this.bySender.values()].reduce((sum, grants) => sum + grants.size, 0);
		while (total > MAX_GRANTS_TOTAL) {
			const first = this.bySender.entries().next().value as
				| [number, Map<string, ProjectFileGrant>]
				| undefined;
			if (!first) return;
			const [senderId, grants] = first;
			const oldest = grants.keys().next().value as string | undefined;
			if (oldest === undefined) this.bySender.delete(senderId);
			else grants.delete(oldest);
			if (grants.size === 0) this.bySender.delete(senderId);
			total--;
		}
	}
}

export function isTrustedProjectSender(
	senderId: number,
	trustedSenderId: number | null,
	isMainFrame = true,
): boolean {
	return (
		isMainFrame && Number.isSafeInteger(senderId) && senderId > 0 && senderId === trustedSenderId
	);
}

/** CLI access is limited to the exact path supplied in its main-process parsed command. */
export function isExactCliProjectPath(
	requestedPath: unknown,
	authorizedPath: string | null,
): boolean {
	if (typeof requestedPath !== "string" || !authorizedPath) return false;
	try {
		return path.resolve(requestedPath) === path.resolve(authorizedPath);
	} catch {
		return false;
	}
}

interface ProjectFileSender {
	id: number;
	mainFrame: unknown;
	getURL(): string;
}

interface ProjectFileWindow {
	webContents: ProjectFileSender;
	isDestroyed(): boolean;
}

interface ParsedCliProjectCommand {
	kind: string;
	projectPath?: string;
}

/**
 * The same main-process authority used by the IPC grant and load handlers.
 * It binds access to the current main window, its main frame, and its URL role.
 */
export function createProjectFileAuthority(
	getMainWindow: () => ProjectFileWindow | null,
	cliCommand: ParsedCliProjectCommand | null,
	grants: ProjectFileGrantStore,
) {
	const trustedWindow = (
		sender: ProjectFileSender,
		senderFrame: unknown,
		windowType: string,
	): ProjectFileWindow | null => {
		const window = getMainWindow();
		if (
			!window ||
			window.isDestroyed() ||
			window.webContents !== sender ||
			senderFrame !== sender.mainFrame
		) {
			return null;
		}
		try {
			return new URL(sender.getURL()).searchParams.get("windowType") === windowType ? window : null;
		} catch {
			return null;
		}
	};

	return {
		grantDropFile(sender: ProjectFileSender, senderFrame: unknown, filePath: unknown): boolean {
			const editor = trustedWindow(sender, senderFrame, "editor");
			return Boolean(
				editor &&
					isTrustedProjectSender(sender.id, editor.webContents.id, true) &&
					grants.grant(sender.id, filePath),
			);
		},
		authorizeLoadPath(
			sender: ProjectFileSender,
			senderFrame: unknown,
			filePath: unknown,
		): string | null {
			const editor = trustedWindow(sender, senderFrame, "editor");
			if (editor && isTrustedProjectSender(sender.id, editor.webContents.id, true)) {
				return grants.consume(sender.id, filePath);
			}
			if (cliCommand?.kind !== "export" && cliCommand?.kind !== "captions") return null;
			const cliWindow = trustedWindow(sender, senderFrame, `cli-${cliCommand.kind}`);
			return cliWindow &&
				typeof filePath === "string" &&
				isExactCliProjectPath(filePath, cliCommand.projectPath ?? null)
				? path.resolve(filePath)
				: null;
		},
	};
}
