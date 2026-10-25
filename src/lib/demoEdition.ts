type EditionRoot = { dataset: DOMStringMap };

/** Apply the build-time visual edition before the renderer mounts. */
export function applyDemoEdition(root: EditionRoot, edition: string | undefined): void {
	root.dataset.edition = edition === "pip" ? "pip" : "baseline";
}
