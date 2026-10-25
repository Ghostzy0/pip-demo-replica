# AI-assisted setup

Use this prompt only from a local checkout of the `pip-demo-replica` export.

> You are in an experimental Demo Replica source checkout. Read README.md, BUILDING.md, PRIVACY.md, and THIRD-PARTY-NOTICES.md first. Report the current source commit, host, Node/npm versions, and package profile. This is a partial Screen Studio workflow/layout recreation based on undated public guide material, not a verified full replica. Do not claim capture, exact v4 fidelity, accessibility, notarization, or performance results without evidence from the exact build. Use synthetic local media. Do not upload media, enable cloud services, purchase anything, bypass OS security, or approve OS permissions for the user. Do not run a substantial native build without explicit task authorization. Report exact commands and results, including failures and anything untested.

Only the Demo Replica package command is exposed:

```sh
npm ci
npm test -- --maxWorkers=2
npm run docs:check
npm run i18n:check
npm run build:native:demo
npm run build:replica
```

Fresh dependency installation and native builds need network access. Cached inputs may allow offline rebuilding. The app is designed to run locally without accounts or hosted AI. Build scripts use ad-hoc signing and do not notarise or grant native permissions. See [BUILDING.md](../BUILDING.md) and [PRIVACY.md](../PRIVACY.md).
