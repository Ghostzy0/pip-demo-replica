import { describe, expect, it } from "vitest";
import {
	demoPackageMetadata,
	resolveDemoBuildProfile,
	resolveDemoBuildProfileFromEnv,
} from "./demo-build-profiles.mjs";

describe("Demo build profiles", () => {
	it("keeps four public identities distinct and preserves the two Core identities", () => {
		const profiles = ["replica", "neutral-plus", "pip", "pip-plus"].map((name) =>
			resolveDemoBuildProfile(name),
		);
		expect(profiles.map(({ appId }) => appId)).toEqual([
			"uk.pip.demo.replica",
			"uk.pip.demo.plus",
			"uk.pip.demo",
			"uk.pip.demo.pip.plus",
		]);
		expect(new Set(profiles.map(({ appId }) => appId)).size).toBe(4);
		expect(new Set(profiles.map(({ storageDirName }) => storageDirName)).size).toBe(4);
		expect(profiles.map(({ productName }) => productName)).toEqual([
			"Demo Replica",
			"Demo Plus",
			"Pip Demo",
			"Pip Demo Plus",
		]);
		expect(profiles.map(({ version }) => version)).toEqual([
			"0.1.0-alpha.1",
			"0.2.0-alpha.1",
			"0.1.0-alpha.1",
			"0.2.0-alpha.1",
		]);
		expect(profiles.map(({ repositoryName }) => repositoryName)).toEqual([
			"pip-demo-replica",
			"pip-demo",
			"pip-demo",
			"pip-demo",
		]);
		expect(profiles.map(({ repositoryPageUrl }) => repositoryPageUrl)).toEqual([
			"https://github.com/Ghostzy0/pip-demo-replica",
			"https://github.com/Ghostzy0/pip-demo",
			"https://github.com/Ghostzy0/pip-demo",
			"https://github.com/Ghostzy0/pip-demo",
		]);
		expect(profiles.map(({ releaseApiUrl }) => releaseApiUrl)).toEqual([
			"https://api.github.com/repos/Ghostzy0/pip-demo-replica/releases/latest",
			"https://api.github.com/repos/Ghostzy0/pip-demo/releases/latest",
			"https://api.github.com/repos/Ghostzy0/pip-demo/releases/latest",
			"https://api.github.com/repos/Ghostzy0/pip-demo/releases/latest",
		]);
		expect(profiles.map(({ releaseTagPrefix }) => releaseTagPrefix)).toEqual([
			"/Ghostzy0/pip-demo-replica/releases/tag/",
			"/Ghostzy0/pip-demo/releases/tag/",
			"/Ghostzy0/pip-demo/releases/tag/",
			"/Ghostzy0/pip-demo/releases/tag/",
		]);
		expect(demoPackageMetadata(profiles[0])).toEqual({
			version: "0.1.0-alpha.1",
			homepage: "https://github.com/Ghostzy0/pip-demo-replica",
			repository: {
				type: "git",
				url: "git+https://github.com/Ghostzy0/pip-demo-replica.git",
			},
		});
		expect(demoPackageMetadata(profiles[1]).homepage).toBe("https://github.com/Ghostzy0/pip-demo");
		expect(resolveDemoBuildProfile("baseline")).toMatchObject({
			appId: "uk.pip.demo.baseline",
			storageDirName: "Demo-Baseline",
			publicVariant: false,
		});
	});

	it("maps the appearance and extras axes and safely falls back for unknown development values", () => {
		expect(
			resolveDemoBuildProfileFromEnv({
				VITE_DEMO_PRODUCT: "replica",
				VITE_DEMO_APPEARANCE: "baseline",
				VITE_DEMO_EXTRAS: "plus",
			}),
		).toMatchObject({ variant: "neutral-plus", product: "replica", extras: "plus" });
		expect(
			resolveDemoBuildProfileFromEnv({
				VITE_DEMO_PRODUCT: "unknown",
				VITE_DEMO_APPEARANCE: "unknown",
				VITE_DEMO_EXTRAS: "unknown",
			}),
		).toMatchObject({
			variant: "baseline",
			product: "custom",
			appearance: "baseline",
			extras: "core",
		});
		expect(resolveDemoBuildProfileFromEnv({ VITE_DEMO_EDITION: "pip" })).toMatchObject({
			variant: "pip",
			appearance: "pip",
		});
	});

	it("rejects unknown variants and unsupported axis combinations", () => {
		expect(() => resolveDemoBuildProfile("typo")).toThrow(/Unknown Demo build variant/);
		expect(() =>
			resolveDemoBuildProfile({ product: "replica", appearance: "pip", extras: "core" }),
		).toThrow(/Unsupported Demo profile combination/);
	});
});
