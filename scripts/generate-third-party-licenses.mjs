// Generates the license inventory shipped in macOS packages. Exact-version source notices in
// licenses/curated/ fill gaps in published npm/crate archives only when the corresponding lock
// integrity/checksum and the notice's SHA-256 match. Missing texts fail the public build.
// A private diagnostic may be written only to a non-package path with --allow-incomplete.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "build-licenses", "THIRD-PARTY-LICENSES.txt");
const ADDON_CRATE = "compositor-view-napi";
const LICENSE_FILE = /^(licen[cs]e|copying|notice)/i;
const NO_FILE = "(no licence file in the package)";
const REVIEWED_MIT_FALLBACKS = new Set([
	"dlv\u00001.1.3",
	"lazy-val\u00001.0.5",
	"react-remove-scroll-bar\u00002.3.8",
	"block\u00000.1.6",
	"malloc_buf\u00000.0.6",
]);
const MIT_CANONICAL_TEMPLATE_SHA256 =
	"b05785f9f18e6716bab63424b11454513b9943a222595b70411009202fc592b5";

/**
 * The licence and NOTICE files at the top of a package directory, in file-name order, then the
 * `extra` files that exist. A text read twice is printed once: renderSection merges it.
 */
function readLicenseTexts(dir, extra = []) {
	const names = fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && LICENSE_FILE.test(entry.name))
		.map((entry) => entry.name)
		.sort();
	return [
		...names.map((name) => path.join(dir, name)),
		...extra.filter((file) => fs.existsSync(file)),
	]
		.map((file) => fs.readFileSync(file, "utf8"))
		.filter((text) => text.trim());
}

/**
 * SPDX expression from a package.json or a cargo package; tolerates the legacy object forms.
 * A crate may declare only a `license_file`, a custom licence, which is then named instead.
 */
function declaredLicense({ license, licenses, license_file }) {
	const values = [license ?? licenses].flat();
	const ids = values.map((value) => (typeof value === "string" ? value : value?.type));
	return (
		ids.filter(Boolean).join(" OR ") ||
		(license_file ? `see ${license_file}` : "no declared licence")
	);
}

function readJson(file) {
	try {
		return JSON.parse(fs.readFileSync(file, "utf8"));
	} catch {
		return {};
	}
}

const packageKey = (name, version) => `${name}\u0000${version}`;

/** Reject a changed legal file even if the dependency pin itself still matches. */
export function loadCuratedOverrides(root = ROOT) {
	const manifestPath = path.join(root, "licenses", "curated-manifest.json");
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	if (manifest.schemaVersion !== 1)
		throw new Error(`Unsupported curated licence manifest: ${manifestPath}`);
	const load = (records, pinField) => {
		const overrides = new Map();
		for (const record of records) {
			const key = packageKey(record.name, record.version);
			if (overrides.has(key))
				throw new Error(`Duplicate curated licence: ${record.name} ${record.version}`);
			if (record.mode === "declared-mit-fallback") {
				if (
					!REVIEWED_MIT_FALLBACKS.has(key) ||
					record.declaredLicense !== "MIT" ||
					record.canonicalTextSha256 !== MIT_CANONICAL_TEMPLATE_SHA256
				) {
					throw new Error(`Unreviewed MIT fallback: ${record.name} ${record.version}`);
				}
			} else if (record.mode && record.mode !== "source-file") {
				throw new Error(`Unknown curated licence mode: ${record.name} ${record.version}`);
			}
			if (!record[pinField] || !/^curated\/[a-zA-Z0-9.+_-]+\.txt$/.test(record.licenseFile)) {
				throw new Error(`Invalid curated licence pin or path: ${record.name} ${record.version}`);
			}
			const file = path.join(root, "licenses", record.licenseFile);
			const bytes = fs.readFileSync(file);
			const actual = createHash("sha256").update(bytes).digest("hex");
			if (actual !== record.sha256) {
				throw new Error(
					`Curated licence SHA-256 mismatch: ${record.name} ${record.version} (${file})`,
				);
			}
			overrides.set(key, { ...record, text: bytes.toString("utf8") });
		}
		return overrides;
	};
	return { npm: load(manifest.npm, "integrity"), rust: load(manifest.rust, "checksum") };
}

/** Cargo.lock's registry checksums, kept separate from metadata's resolved target graph. */
export function readCargoLockChecksums(root = ROOT) {
	const lock = fs.readFileSync(path.join(root, "crates", "Cargo.lock"), "utf8");
	const checksums = new Map();
	for (const block of lock.split(/^\[\[package\]\]\s*$/m).slice(1)) {
		const name = /^name = "([^"]+)"/m.exec(block)?.[1];
		const version = /^version = "([^"]+)"/m.exec(block)?.[1];
		const checksum = /^checksum = "([a-f0-9]{64})"/m.exec(block)?.[1];
		if (name && version && checksum) checksums.set(packageKey(name, version), checksum);
	}
	return checksums;
}

/**
 * Production npm packages: package-lock.json entries under node_modules/ that are not `dev`
 * (`optional` and `devOptional` ones included). An entry not installed on this machine, such as
 * another platform's optional binary, is skipped: none of its code was bundled here.
 */
export function collectNpmPackages(root = ROOT, overrides = new Map()) {
	const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
	const packages = new Map();
	const skipped = [];
	for (const [key, entry] of Object.entries(lock.packages ?? {})) {
		if (!key.startsWith("node_modules/") || entry.dev) continue;
		const dir = path.join(root, key);
		if (!fs.existsSync(dir)) {
			skipped.push(key);
			continue;
		}
		const name = key.split("node_modules/").pop();
		const info = { name, ...entry, ...readJson(path.join(dir, "package.json")) };
		const label = `${info.name} ${info.version} (${declaredLicense(info)})`;
		const identity = `${label}\u0000${entry.integrity ?? "no-integrity"}`;
		if (!packages.has(identity)) {
			const localTexts = readLicenseTexts(dir);
			const override = overrides.get(packageKey(info.name, info.version));
			const compatible =
				override &&
				info.version === entry.version &&
				override.integrity === entry.integrity &&
				override.declaredLicense === declaredLicense(info) &&
				(override.mode !== "declared-mit-fallback" ||
					(entry.license === "MIT" && info.license === "MIT"));
			const texts = localTexts.length > 0 ? localTexts : compatible ? [override.text] : [];
			packages.set(identity, {
				label,
				texts,
				...(localTexts.length === 0 && compatible && override.mode === "declared-mit-fallback"
					? { basis: "declared-mit-fallback" }
					: {}),
			});
		}
	}
	return { entries: [...packages.values()], skipped };
}

/**
 * Crates compiled into the addon: the closure of NORMAL dependencies of compositor-view-napi,
 * for every target platform. Build-dependencies never reach the binary, and neither do
 * procedural macros, which run inside rustc, nor what only they pull in, so the walk stops at
 * them. Workspace members are OpenScreen's own code, under its LICENSE.
 */
export function collectCrates(
	metadata,
	{ overrides = new Map(), lockChecksums = new Map(), includedPackages } = {},
) {
	const packages = new Map(metadata.packages.map((pkg) => [pkg.id, pkg]));
	const deps = new Map(metadata.resolve.nodes.map((node) => [node.id, node.deps]));
	const members = new Set(metadata.workspace_members);
	const isProcMacro = (pkg) => pkg.targets.some((target) => target.kind.includes("proc-macro"));
	const root = metadata.packages.find((pkg) => pkg.name === ADDON_CRATE && members.has(pkg.id));
	if (!root) throw new Error(`${ADDON_CRATE} is not a member of the cargo workspace`);

	const seen = new Set();
	const stack = [root.id];
	while (stack.length > 0) {
		const id = stack.pop();
		if (seen.has(id) || isProcMacro(packages.get(id))) continue;
		seen.add(id);
		for (const dep of deps.get(id) ?? []) {
			if (dep.dep_kinds.some((kind) => kind.kind === null)) stack.push(dep.pkg);
		}
	}
	return [...seen]
		.filter((id) => !members.has(id))
		.map((id) => packages.get(id))
		.filter((pkg) => !includedPackages || includedPackages.has(packageKey(pkg.name, pkg.version)))
		.map((pkg) => {
			const dir = path.dirname(pkg.manifest_path);
			// Cargo's `license-file` is relative to the manifest and may sit below the top level.
			const declared = pkg.license_file ? [path.resolve(dir, pkg.license_file)] : [];
			const localTexts = readLicenseTexts(dir, declared);
			const key = packageKey(pkg.name, pkg.version);
			const override = overrides.get(key);
			const compatible =
				override &&
				override.checksum === lockChecksums.get(key) &&
				override.declaredLicense === pkg.license;
			return {
				label: `${pkg.name} ${pkg.version} (${declaredLicense(pkg)})`,
				texts: localTexts.length > 0 ? localTexts : compatible ? [override.text] : [],
				...(localTexts.length === 0 && compatible && override.mode === "declared-mit-fallback"
					? { basis: "declared-mit-fallback" }
					: {}),
			};
		});
}

// Code-unit order, not localeCompare: the same input must give the same bytes on every runner.
const byLabel = (a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
const RULE = "=".repeat(80);
const LINE = "-".repeat(80);

/** Each distinct text once, after the sorted labels of every package that ships it. */
function renderSection(title, entries) {
	const groups = new Map();
	for (const { label, texts } of [...entries].sort(byLabel)) {
		for (const text of texts.length > 0 ? texts : [NO_FILE]) {
			const key = text.replace(/\s+/g, " ").trim();
			const group = groups.get(key) ?? { text: text.replace(/\r\n?/g, "\n").trim(), labels: [] };
			groups.set(key, group);
			if (group.labels.at(-1) !== label) group.labels.push(label);
		}
	}
	const blocks = [...groups.values()].map(({ labels, text }) =>
		[LINE, ...labels, "", text, ""].join("\n"),
	);
	return [RULE, title, RULE, "", ...blocks].join("\n");
}

function summary(noun, entries) {
	const missing = entries.filter((entry) => entry.texts.length === 0).length;
	return `${noun}: ${entries.length} (${missing} without a licence file).`;
}

export function renderLicenses({ npm, crates, target = "unspecified", qualified = true }) {
	const fallbacks = [...npm, ...crates].filter((entry) => entry.basis === "declared-mit-fallback");
	const header = [
		qualified
			? "Pip Demo: third-party licences"
			: "UNQUALIFIED DIAGNOSTIC — NOT FOR PUBLIC PACKAGING",
		"",
		`Rust target: ${target}. Cargo metadata is locked${target === "unspecified" ? "" : " and target-filtered"}.`,
		"The licence texts for installed production npm packages and Rust crates reachable",
		"from the native compositor addon (compositor_view.node). Each distinct text",
		'appears once, preceded by the packages that ship it as "name version (declared licence)".',
		"Exact source files and reviewed MIT declaration fallbacks are pinned in",
		"licenses/curated-manifest.json. A fallback does not assert a missing copyright holder.",
		`Reviewed MIT declaration fallbacks used: ${fallbacks.length}${fallbacks.length ? ` (${fallbacks.map((entry) => entry.label).join(", ")})` : ""}.`,
		"",
		"The other bundled components (FFmpeg, whisper.cpp, ONNX Runtime, fonts, model weights",
		"and more) and their source offers are described in THIRD-PARTY-NOTICES.md, beside this",
		"file. Generated at build time by scripts/generate-third-party-licenses.mjs.",
		"",
		summary("npm packages", npm),
		summary("Rust crates", crates),
		"",
	];
	const sections = [
		renderSection("npm packages", npm),
		renderSection("Rust crates compiled into the compositor addon", crates),
	];
	return `${[...header, ...sections].join("\n").trimEnd()}\n`;
}

export function macTargetForArch(arch) {
	if (arch === "arm64") return "aarch64-apple-darwin";
	if (arch === "x64") return "x86_64-apple-darwin";
	throw new Error(`Unsupported macOS licence target architecture: ${arch}`);
}

export function cargoMetadataArgs(target) {
	return [
		"metadata",
		"--locked",
		"--format-version",
		"1",
		...(target ? ["--filter-platform", target] : []),
		"--manifest-path",
		path.join(ROOT, "crates", "Cargo.toml"),
	];
}

function cargoMetadata(target) {
	const exe = process.platform === "win32" ? "cargo.exe" : "cargo";
	const rustup = path.join(os.homedir(), ".cargo", "bin", exe);
	const crates = path.join(ROOT, "crates");
	const result = spawnSync(
		fs.existsSync(rustup) ? rustup : "cargo",
		cargoMetadataArgs(target),
		// cwd = crates/ so cargo reads crates/.cargo/config.toml, like the addon builds do.
		// The JSON is ~1 MB already, which is spawnSync's default buffer.
		{ cwd: crates, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
	);
	if (result.error) throw new Error(`cargo metadata could not run: ${result.error.message}`);
	if (result.status !== 0) {
		const last = result.stderr.trim().split("\n").pop();
		throw new Error(`cargo metadata failed, exit code ${result.status}: ${last}`);
	}
	return JSON.parse(result.stdout);
}

/** Cargo metadata includes optional and conditional edges even with --filter-platform.
 * cargo tree resolves the actual normal-dependency graph for this exact target. */
export function parseCargoTreePackages(output) {
	const included = new Set();
	for (const line of output.split("\n")) {
		const match = /^([^\s]+) v([^\s]+)/.exec(line);
		if (match) included.add(packageKey(match[1], match[2]));
	}
	return included;
}

function cargoTreePackages(target) {
	const exe = process.platform === "win32" ? "cargo.exe" : "cargo";
	const rustup = path.join(os.homedir(), ".cargo", "bin", exe);
	const crates = path.join(ROOT, "crates");
	const args = [
		"tree",
		"--locked",
		"--manifest-path",
		path.join(crates, "Cargo.toml"),
		"-p",
		ADDON_CRATE,
		"-e",
		"normal",
		"--prefix",
		"none",
		"--format",
		"{p}",
		...(target ? ["--target", target] : []),
	];
	const result = spawnSync(fs.existsSync(rustup) ? rustup : "cargo", args, {
		cwd: crates,
		encoding: "utf8",
		maxBuffer: 256 * 1024 * 1024,
	});
	if (result.error) throw new Error(`cargo tree could not run: ${result.error.message}`);
	if (result.status !== 0) {
		const last = result.stderr.trim().split("\n").pop();
		throw new Error(`cargo tree failed, exit code ${result.status}: ${last}`);
	}
	return parseCargoTreePackages(result.stdout);
}

export function assertCompleteLicenses({ npm, crates }, { allowIncomplete = false } = {}) {
	const missing = [...npm, ...crates].filter((entry) => entry.texts.length === 0);
	if (missing.length > 0 && !allowIncomplete) {
		throw new Error(
			`Public package licence gate failed: ${missing.length} entries have no verified full text:\n` +
				missing.map((entry) => `  - ${entry.label}`).join("\n") +
				"\nAdd an exact-version source notice with matching lock pin and SHA-256, or use " +
				"--allow-incomplete with a non-package output path for private diagnostics only.",
		);
	}
	return missing;
}

function main() {
	const args = process.argv.slice(2);
	const allowIncomplete = args.includes("--allow-incomplete");
	const paths = args.filter((arg) => arg !== "--allow-incomplete");
	if (paths.length > 1 || paths.some((arg) => arg.startsWith("--"))) {
		throw new Error("Usage: generate-third-party-licenses.mjs [--allow-incomplete] [output path]");
	}
	const output = paths[0] ? path.resolve(paths[0]) : OUTPUT;
	if (allowIncomplete && output === OUTPUT) {
		throw new Error("Private diagnostic mode requires a non-package output path.");
	}
	// A failed package-mode run must not leave a previously generated file available to package.
	if (output === OUTPUT) fs.rmSync(OUTPUT, { force: true });
	const target = process.platform === "darwin" ? macTargetForArch(process.arch) : undefined;
	const overrides = loadCuratedOverrides();
	const { entries: npm, skipped } = collectNpmPackages(ROOT, overrides.npm);
	// Throws without cargo: no fallback, see the top of this file.
	const crates = collectCrates(cargoMetadata(target), {
		overrides: overrides.rust,
		lockChecksums: readCargoLockChecksums(),
		includedPackages: cargoTreePackages(target),
	});
	assertCompleteLicenses({ npm, crates }, { allowIncomplete });

	const text = renderLicenses({
		npm,
		crates,
		target: target ?? "unfiltered non-macOS",
		qualified: !allowIncomplete,
	});
	fs.mkdirSync(path.dirname(output), { recursive: true });
	const temporary = `${output}.${process.pid}.tmp`;
	try {
		fs.writeFileSync(temporary, text);
		fs.renameSync(temporary, output);
	} finally {
		fs.rmSync(temporary, { force: true });
	}
	console.log(
		`Wrote ${path.relative(ROOT, output)} (${Math.round(Buffer.byteLength(text) / 1024)} KB): ` +
			`${npm.length} npm packages, ${crates.length} Rust crates` +
			(skipped.length > 0 ? `; ${skipped.length} lock entries not installed here skipped.` : "."),
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
	main();
}
