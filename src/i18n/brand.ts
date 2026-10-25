/** Rebrand bundled UI copy while retaining technical references and upstream credit.
 * Call before interpolation: user project titles and other runtime values are never rewritten.
 */
export function brandProductText(text: string, productName: string): string {
	return text.replace(
		/[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>"'`]+|\.openscreen\b|OpenScreen contributors[^\n]*|Copyright[^\n]*|©[^\n]*|\b(?:OpenScreen|Openscreen|OPENSCREEN)\b/g,
		(token) => (["OpenScreen", "Openscreen", "OPENSCREEN"].includes(token) ? productName : token),
	);
}

/** Copy resources rather than mutating the imported upstream dictionaries. */
export function brandMessages<T>(value: T, productName: string): T {
	if (typeof value === "string") return brandProductText(value, productName) as T;
	if (Array.isArray(value)) return value.map((child) => brandMessages(child, productName)) as T;
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, child]) => [key, brandMessages(child, productName)]),
		) as T;
	}
	return value;
}
