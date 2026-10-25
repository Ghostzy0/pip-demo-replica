import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const CAMERA_SHA256 = "daa5d38991b6a013367a9be88cb03229bb01abeee5129707a70a3987511c9e94";
export const CAMERA_PATH =
	"public/mediapipe/selfie_segmentation/selfie_segmentation_landscape.onnx";
export const CAMERA_URL =
	"https://raw.githubusercontent.com/getopenscreen/openscreen/d8bf2d8138cc2ce2c6542549853260f716cb8fb6/" +
	CAMERA_PATH;
export function assertAsset(file, expected) {
	if (!fs.existsSync(file))
		throw new Error(
			`Required runtime asset missing: ${path.basename(file)}. Run npm run fetch:camera.`,
		);
	const actual = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
	if (actual !== expected)
		throw new Error(`Runtime asset checksum mismatch: ${path.basename(file)}`);
}
export function assertRuntimeAssets(root) {
	assertAsset(path.join(root, CAMERA_PATH), CAMERA_SHA256);
	assertAsset(
		path.join(root, "public/sounds/click-down.wav"),
		"5ee1f31045bb5861f28fafd823e355ff0ca92ea5631798cf7229433c7fba8b65",
	);
	assertAsset(
		path.join(root, "public/sounds/click-up.wav"),
		"b824e53cba778b2c60570b05883003bc49642746df5759e125d53a41e3ad4264",
	);
	if (!fs.existsSync(path.join(root, "public/mediapipe/LICENSE-APACHE-2.0.txt")))
		throw new Error("Camera model licence text missing");
}
export async function fetchCameraAsset(root, fetcher = fetch) {
	const dest = path.join(root, CAMERA_PATH);
	if (fs.existsSync(dest)) {
		assertAsset(dest, CAMERA_SHA256);
		return;
	}
	const response = await fetcher(CAMERA_URL, { signal: AbortSignal.timeout(60_000) });
	if (!response.ok) throw new Error(`Camera asset fetch failed: HTTP ${response.status}`);
	const bytes = Buffer.from(await response.arrayBuffer());
	if (createHash("sha256").update(bytes).digest("hex") !== CAMERA_SHA256)
		throw new Error("Camera asset download checksum mismatch");
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	// Exclusive publish prevents replacing an asset created concurrently.
	fs.writeFileSync(dest, bytes, { flag: "wx" });
	console.log("Verified Apache-2.0 camera segmentation asset installed (457447 bytes).");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
	await fetchCameraAsset(root);
	assertRuntimeAssets(root);
}
