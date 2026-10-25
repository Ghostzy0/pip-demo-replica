/**
 * Approximate MP4 video payload size from the bitrate requested of the encoder.
 * This intentionally excludes audio and MP4/container overhead; VBR means the
 * actual video stream can also differ substantially from its target bitrate.
 */
export function estimateMp4VideoBytes(
	bitrate: number | undefined,
	frameCount: number,
	fps: number,
): number | null {
	if (
		typeof bitrate !== "number" ||
		!Number.isFinite(bitrate) ||
		!(bitrate > 0) ||
		!Number.isFinite(frameCount) ||
		!(frameCount > 0) ||
		!Number.isFinite(fps) ||
		!(fps > 0)
	) {
		return null;
	}
	const bytes = (bitrate * (frameCount / fps)) / 8;
	return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
}
