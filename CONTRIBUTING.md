# Contributing

Use synthetic media. Preserve upstream MIT and third-party notices; document code, font, model and asset provenance independently. Never add telemetry, account adapters or new network requests without an explicit product decision and review. Do not import proprietary reference source/assets or reserved motion implementations.

Install with `npm ci`, run `npm test -- --maxWorkers=2` and `npx tsc --noEmit`, then run the product-specific checks and build commands exposed by this repository's `package.json`. Keep PRs focused, describe actual behavior and evidence, and name untested native/manual cases. Do not infer one product profile's acceptance from another. No paid CI runners are configured by default.
