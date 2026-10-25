import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

async function publishStagedFile(temporary: string, destination: string): Promise<void> {
	for (let attempt = 0; ; attempt++) {
		try {
			await fs.rename(temporary, destination);
			return;
		} catch (error) {
			const code = (error as NodeJS.ErrnoException).code;
			// Indexers can briefly hold an existing destination open on Windows.
			// EXDEV is deliberately not copied over the destination: that is unsafe.
			if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) throw error;
			await new Promise((resolve) => setTimeout(resolve, 10 * 2 ** attempt));
		}
	}
}

/** Publish a complete user file without truncating a prior save on write failure. */
export async function atomicWriteUserFile(filePath: string, data: string | Buffer): Promise<void> {
	const temporary = path.join(
		path.dirname(filePath),
		`.${path.basename(filePath)}.${randomUUID()}.tmp`,
	);
	let handle: fs.FileHandle | undefined;
	try {
		handle = await fs.open(temporary, "wx", 0o600);
		await handle.writeFile(data);
		await handle.sync();
		await handle.close();
		handle = undefined;
		// A sibling rename stays on one filesystem. Do not fall back to copying over
		// the destination: a failed copy would damage the previous file.
		await publishStagedFile(temporary, filePath);
	} finally {
		await handle?.close().catch(() => undefined);
		await fs.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== "ENOENT") throw error;
		});
	}
}
