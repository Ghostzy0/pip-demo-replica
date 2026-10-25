type ProductRoot = { dataset: DOMStringMap; classList: Pick<DOMTokenList, "add"> };
/** The shared build profile owns selection; this only paints its DOM marker. */
export function applyDemoProduct(root: ProductRoot, product: "replica" | "custom"): void {
	root.dataset.product = product;
	if (product === "replica") {
		root.dataset.theme = "dark";
		root.classList.add("dark");
	}
}
