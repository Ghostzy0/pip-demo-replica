export type DemoProduct = "custom" | "replica";
export type DemoAppearance = "baseline" | "pip";
export type DemoExtras = "core" | "plus";

export interface DemoBuildProfile {
	variant: string;
	product: DemoProduct;
	appearance: DemoAppearance;
	extras: DemoExtras;
	productName: string;
	appId: string;
	storageDirName: string;
	version: string;
	publicVariant: boolean;
	repositoryOwner: string;
	repositoryName: string;
	repositoryPageUrl: string;
	repositoryGitUrl: string;
	releaseApiUrl: string;
	releaseTagPrefix: string;
}

export function resolveDemoBuildProfile(
	input?: string | Partial<Pick<DemoBuildProfile, "product" | "appearance" | "extras">>,
): DemoBuildProfile;
export function resolveDemoBuildProfileFromEnv(
	env?: Record<string, string | undefined>,
): DemoBuildProfile;
export function demoPackageMetadata(profile: DemoBuildProfile): {
	version: string;
	homepage: string;
	repository: { type: "git"; url: string };
};
