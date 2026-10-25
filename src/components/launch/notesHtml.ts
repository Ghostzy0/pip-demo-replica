import DOMPurify from "dompurify";

/**
 * Notes support only the formatting provided by NotesToolbar/StarterKit. Keep pasted and
 * restored markup inside that small document language, so attributes, media, embeds and
 * browser-specific markup never become part of persisted notes.
 */
export const NOTES_ALLOWED_TAGS = [
	"blockquote",
	"b",
	"br",
	"code",
	"del",
	"em",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"hr",
	"i",
	"li",
	"ol",
	"p",
	"pre",
	"s",
	"strike",
	"strong",
	"ul",
] as const;

const NOTES_SANITIZE_CONFIG = {
	ALLOWED_TAGS: [...NOTES_ALLOWED_TAGS],
	// Ordered-list starts are part of supported list formatting. No other HTML attributes are
	// needed by Notes; this deliberately drops data-pm-slice and every pasted style/event attr.
	ALLOWED_ATTR: ["start"],
	ALLOW_DATA_ATTR: false,
	ALLOW_ARIA_ATTR: false,
	RETURN_TRUSTED_TYPE: false,
};

export function sanitizeNotesHtml(html: string): string {
	const purifier =
		typeof DOMPurify.sanitize === "function"
			? DOMPurify
			: typeof window === "undefined"
				? null
				: DOMPurify(window);
	// The Notes editor only runs in a browser. If this helper is accidentally called in a
	// non-DOM process, fail closed instead of returning attacker-controlled markup unchanged.
	return (purifier?.sanitize(html, NOTES_SANITIZE_CONFIG) as string | undefined) ?? "";
}
