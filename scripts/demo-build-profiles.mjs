const PIP_REPOSITORY = "pip-demo";
const REPLICA_REPOSITORY = "pip-demo-replica";

function withRepository(profile, repositoryName) {
	const repositoryOwner = "Ghostzy0";
	const repositoryPageUrl = `https://github.com/${repositoryOwner}/${repositoryName}`;
	return {
		...profile,
		repositoryOwner,
		repositoryName,
		repositoryPageUrl,
		repositoryGitUrl: `git+${repositoryPageUrl}.git`,
		releaseApiUrl: `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/releases/latest`,
		releaseTagPrefix: `/${repositoryOwner}/${repositoryName}/releases/tag/`,
	};
}

const PROFILES = Object.freeze({
	foundation: {
		variant: "baseline",
		product: "custom",
		appearance: "baseline",
		extras: "core",
		productName: "Demo Baseline",
		appId: "uk.pip.demo.baseline",
		storageDirName: "Demo-Baseline",
		version: "0.1.0-alpha.1",
		publicVariant: false,
		repositoryName: PIP_REPOSITORY,
	},
	replica: {
		variant: "replica",
		product: "replica",
		appearance: "baseline",
		extras: "core",
		productName: "Demo Replica",
		appId: "uk.pip.demo.replica",
		storageDirName: "Demo-Replica",
		version: "0.1.0-alpha.1",
		publicVariant: true,
		repositoryName: REPLICA_REPOSITORY,
	},
	neutralPlus: {
		variant: "neutral-plus",
		product: "replica",
		appearance: "baseline",
		extras: "plus",
		productName: "Demo Plus",
		appId: "uk.pip.demo.plus",
		storageDirName: "Demo-Plus",
		version: "0.2.0-alpha.1",
		publicVariant: true,
		repositoryName: PIP_REPOSITORY,
	},
	pip: {
		variant: "pip",
		product: "custom",
		appearance: "pip",
		extras: "core",
		productName: "Pip Demo",
		appId: "uk.pip.demo",
		storageDirName: "Pip-Demo",
		version: "0.1.0-alpha.1",
		publicVariant: true,
		repositoryName: PIP_REPOSITORY,
	},
	pipPlus: {
		variant: "pip-plus",
		product: "custom",
		appearance: "pip",
		extras: "plus",
		productName: "Pip Demo Plus",
		appId: "uk.pip.demo.pip.plus",
		storageDirName: "Pip-Demo-Plus",
		version: "0.2.0-alpha.1",
		publicVariant: true,
		repositoryName: PIP_REPOSITORY,
	},
});

for (const profile of Object.values(PROFILES)) {
	Object.assign(profile, withRepository(profile, profile.repositoryName));
}

const VARIANT_ALIASES = Object.freeze({
	baseline: "foundation",
	foundation: "foundation",
	replica: "replica",
	"neutral-plus": "neutralPlus",
	pip: "pip",
	"pip-plus": "pipPlus",
});

const FALLBACKS = Object.freeze({
	product: "custom",
	appearance: "baseline",
	extras: "core",
});

function choose(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}

/** Resolve the product, look, and feature set as one immutable build identity. */
export function resolveDemoBuildProfile(input = {}) {
	if (typeof input === "string") {
		const key = VARIANT_ALIASES[input];
		if (!key) throw new Error(`Unknown Demo build variant: ${input}`);
		return { ...PROFILES[key] };
	}

	const product = choose(input.product, ["replica", "custom"], FALLBACKS.product);
	const appearance = choose(input.appearance, ["baseline", "pip"], FALLBACKS.appearance);
	const extras = choose(input.extras, ["core", "plus"], FALLBACKS.extras);
	const profile = Object.values(PROFILES).find(
		(candidate) =>
			candidate.product === product &&
			candidate.appearance === appearance &&
			candidate.extras === extras,
	);
	if (!profile) {
		throw new Error(`Unsupported Demo profile combination: ${product}/${appearance}/${extras}`);
	}
	return { ...profile };
}

/** Development defaults are the internal neutral foundation; unknown values fail to it. */
export function resolveDemoBuildProfileFromEnv(env = process.env) {
	const legacyAppearance = env.VITE_DEMO_EDITION === "pip" ? "pip" : undefined;
	return resolveDemoBuildProfile({
		product: env.VITE_DEMO_PRODUCT,
		appearance: env.VITE_DEMO_APPEARANCE ?? legacyAppearance,
		extras: env.VITE_DEMO_EXTRAS,
	});
}

/** Package metadata must point at the same source repository as About and star links. */
export function demoPackageMetadata(profile) {
	return {
		version: profile.version,
		homepage: profile.repositoryPageUrl,
		repository: { type: "git", url: profile.repositoryGitUrl },
	};
}
