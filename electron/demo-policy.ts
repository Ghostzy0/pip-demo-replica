import { DEMO_PROFILE, PLUS_FEATURES_ENABLED } from "../src/lib/demoProfile";

/** Fixed distribution policy: these editions do not enable network/account services. */
export { DEMO_PROFILE, PLUS_FEATURES_ENABLED };
export const PRODUCT_NAME = DEMO_PROFILE.productName;
export const USER_DATA_DIR_NAME = DEMO_PROFILE.storageDirName;
export const LOCAL_ONLY_ERROR =
	"This local edition does not include cloud AI, model downloads, or automation servers.";

/** Local documents remain editable; provider/chat/automation actions fail before touching credentials. */
export function permitsAiEditionAction(action: string): boolean {
	return [
		"document.listProjects",
		"document.get",
		"document.create",
		"document.save",
		"document.delete",
		"document.addAsset",
		"document.removeAsset",
	].includes(action);
}

/** Renderer media and the explicit development server are the only HTTP resources allowed. */
export function permitsResourceUrl(raw: string, devServer?: string): boolean {
	try {
		const url = new URL(raw);
		if (["file:", "data:", "blob:", "devtools:", "chrome-extension:"].includes(url.protocol))
			return true;
		if (devServer && ["http:", "ws:"].includes(url.protocol)) {
			const dev = new URL(devServer);
			return (
				["localhost", "127.0.0.1", "[::1]"].includes(dev.hostname) &&
				url.hostname === dev.hostname &&
				url.port === dev.port
			);
		}
		return false;
	} catch {
		return false;
	}
}
