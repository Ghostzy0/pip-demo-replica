import fs from "node:fs";
import path from "node:path";

function releaseLock(fd, lockPath) {
	let cleanupError;
	try {
		// A replacement lock belongs to another process, even if someone unlinked ours.
		const ours = fs.fstatSync(fd);
		const current = fs.statSync(lockPath);
		if (ours.dev === current.dev && ours.ino === current.ino) fs.unlinkSync(lockPath);
	} catch (error) {
		if (error.code !== "ENOENT") cleanupError = error;
	}
	try {
		fs.closeSync(fd);
	} catch (error) {
		cleanupError ??= error;
	}
	return cleanupError;
}

/**
 * The editions share dist/, dist-electron/, and the generated license file. Refuse a
 * second build before it can overwrite any of those inputs while the first packages.
 * The caller is synchronous, so the lock covers its entire build and pack sequence.
 */
export function withEditionBuildLock(root, edition, build) {
	const buildDir = path.join(root, ".demo-build");
	const lockPath = path.join(buildDir, "edition-build.lock");
	fs.mkdirSync(buildDir, { recursive: true });

	let fd;
	try {
		fd = fs.openSync(lockPath, "wx", 0o600);
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		let owner = "unknown owner";
		try {
			const lease = JSON.parse(fs.readFileSync(lockPath, "utf8"));
			owner = `${lease.edition ?? "unknown edition"} (PID ${lease.pid ?? "unknown"})`;
		} catch {
			// The other process may still be writing its lease, or a crash left an empty lock.
		}
		throw new Error(
			`Another edition build is in progress: ${owner}. Retry after it finishes. ` +
				`If that process has exited, verify the lock is stale before removing ${lockPath}.`,
			{ cause: error },
		);
	}

	let result;
	let buildError;
	let cleanupError;
	try {
		fs.writeFileSync(
			fd,
			JSON.stringify({ edition, pid: process.pid, startedAt: new Date().toISOString() }),
		);
		result = build();
	} catch (error) {
		buildError = error;
	} finally {
		cleanupError = releaseLock(fd, lockPath);
	}
	if (buildError) throw buildError;
	if (cleanupError) throw cleanupError;
	return result;
}
