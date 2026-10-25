export interface ReplicaImportActions {
	projectId: () => string | null;
	pick: () => Promise<{ success: boolean; path?: string; name?: string } | undefined>;
	append: (path: string, label: string, expectedProjectId: string | null) => Promise<void>;
}

/** Cancellation and a project switch during the native picker cannot mutate another project. */
export async function importReplicaVideo(actions: ReplicaImportActions): Promise<boolean> {
	const expected = actions.projectId();
	const picked = await actions.pick();
	if (!picked?.success || !picked.path || actions.projectId() !== expected) return false;
	const label = picked.name || picked.path.split(/[\\/]/).pop() || "Video";
	await actions.append(picked.path, label, expected);
	return true;
}
