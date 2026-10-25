import { renameSync } from "node:fs";
import fs from "node:fs/promises";

/**
 * The Microsoft Store build is an MSIX package: Windows redirects its writes under AppData
 * into the package's private copy of the folder. A rename between that copy and the real
 * folder fails with EXDEV, even inside one directory (#1255). Copying directly over the
 * destination truncates it before the copy has succeeded. If the copy fails (disk full,
 * access revoked, crash), the last good project or recording is lost. Refuse EXDEV instead:
 * the existing destination remains intact. The caller may then clean up its staged file.
 * An MSIX save can fail until its redirected storage path is resolved, but it will not
 * destroy the existing file.
 */

/**
 * The rename half of a temp-then-rename save. Windows fails a rename onto an open file with
 * EPERM/EBUSY: an indexer, an antivirus or a backup agent can hold the destination for a few
 * milliseconds after we last touched it. The write itself is sound, so retry briefly rather
 * than surface a save error the user cannot act on. POSIX renames don't hit this and take
 * the first attempt. EXDEV is surfaced without a copy, preserving prior data.
 */
export async function renameWithRetry(from: string, to: string): Promise<void> {
	const RETRYABLE = new Set(["EPERM", "EACCES", "EBUSY"]);
	for (let attempt = 0; ; attempt++) {
		try {
			await fs.rename(from, to);
			return;
		} catch (error) {
			const code = (error as NodeJS.ErrnoException)?.code ?? "";
			if (attempt >= 5 || !RETRYABLE.has(code)) throw error;
			await new Promise((resolve) => setTimeout(resolve, 10 * 2 ** attempt));
		}
	}
}

/** Synchronous publish; EXDEV is surfaced without touching the existing destination. */
export function renameSyncWithFallback(from: string, to: string): void {
	renameSync(from, to);
}
