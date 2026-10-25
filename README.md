# Pip Demo Replica

Pip Demo Replica is an experimental local macOS screen recorder and demo-video editor. It uses an original neutral interface and a shared engine derived from MIT-licensed OpenScreen code. Its layout and workflow are a **partial recreation based on undated public Screen Studio guide material**; exact Screen Studio 4.1 UI, capture behavior, algorithms, and export equivalence are not established. This is an independent project with no affiliation or compatibility guarantee.

## Availability and current evidence

Experimental source alpha for local developers. No binary downloads are offered. Binary distribution is held by five MIT notice-provenance gaps for `dlv` 1.1.3, `lazy-val` 1.0.5, `react-remove-scroll-bar` 2.3.8, `block` 0.1.6, and `malloc_buf` 0.0.6. The only supported package profile in this repository is **Demo Replica Core**, version `0.1.0-alpha.1`, bundle ID `uk.pip.demo.replica`, and user-data directory `Demo-Replica`.

This exact Replica package passed package-integrity checks as a clean export from ref `ceeba575`: 40 whole-app Mach-O paths were checked, all 36 `LC_RPATH` entries were relative, and deep strict ad-hoc signature verification passed. It passed four headless CLI media exports (control, zoom, voiceover MP4, small GIF). GUI slice one completed import, rename, trim, zoom, Cmd+S save, and MP4 export (1752×1080, nominal 30 fps, 5.666-second container; saved trim 0.752695–1.097605 seconds and zoom 4.653–4.998 seconds). Slice two cold-restored and explicitly reopened the same saved project through File > Open project, then exported a looping 15 fps Small 480p GIF. The project, ranges, timeline, and assets matched slice one. GIF output: 778×480, 85 frames, 5.67 seconds, 4,788,185 bytes (SHA-256 `3b2a3813714bb7fb0544cf58f018817ba3389405caec31f6c023456cbeb9b0d6`); ffprobe and full decode passed. The requested 0.5–1 second trim and 3–5 second zoom placements remain unmet. These runs qualify reopen and GIF export for this one saved project only, not full GUI workflow, capture, ASR, other profiles, Paper theme, reference fidelity, or accessibility technology. On 24 October, the clean remote PR clone at `3774c04` passed `npm ci`, `docs:check`, `i18n:check`, TypeScript checking, and the Replica baseline/core Vite build under Node.js 22.22.1/npm 10.9.4. A full Replica test suite was not run. The clean remote Custom PR clone at `fc14d6a` passed the shared-engine suite (364 files; 4,953 passed, 2 skipped; 4,955 total) and all three profile Vite builds. Historical exports `3774c04` and `fc14d6a` shared normalized engine hash `4ad3c4e…d399013`; the Custom suite does not establish a full Replica-product suite. The initial RPATH fix used focused tests; the hosted source suites recorded below subsequently covered the exported source. At source revision `4a58359`, focused `before-pack.test.mjs` checks passed (27 passed, 1 skipped), and a real temporary macOS Mach-O fixture verified rejection of absolute space-containing `LC_RPATH` values, normalization, relative-path preservation, idempotence, symlink preservation, and strict ad-hoc signature verification. The current normalized shared-engine hash at Replica ref `ceeba575` is `f01935c94e3598165ef60dc4c492b8969a3915b85c8ed4993ca9a1fa9bc033f2`. Capture permissions, current Screen Studio reference behavior, exact v4 fidelity, accessibility-technology testing, notarization, resource measurements, and full native GUI workflow acceptance remain unverified.

Hosted source CI passed for Replica at `d44bc0f3d8c289e3afe2220fcb42fc733d6a2530` on Linux with Node.js 22.22.1/npm 10.9.4 ([run 40173723275](https://github.com/Ghostzy0/pip-demo-replica/actions/runs/40173723275)): 363 test files passed and 1 file skipped; 4,948 tests passed and 7 FFmpeg-dependent tests skipped (4 audio-peak, 3 audio-extraction; 4,955 total) in 144.33s. Type, docs, and i18n checks passed. The corrected workflow built Replica Core (`uk.pip.demo.replica`) and Vite compiled renderer/main/preload bundles; it did not launch the app or build a native package. The current source manifest engine SHA-256 is `3447fde8c6d0dbf40d26ab341f5a181abd835309f5297714641c2d1fb6009b43`. Compared with the f019 package-tested export, only `.github/workflows/checks.yml`, `README.md`, and `BUILDING.md` differ; the other 1,433 of 1,436 payload files, including runtime files, are byte-identical. The earlier workflow run built only the foundation profile.

## Local use and privacy

The app is intended to run locally without an account, cloud provider, or paid service. Cloud providers/chat, automatic model downloads, usage reporting, automatic updates, and automation listeners are disabled. Importing a local video does not require screen-recording permission. Capture, microphone, camera, system audio, and Accessibility use separate OS-controlled choices. Captioning requires separately supplied local model weights; none are downloaded automatically.

A fresh build needs internet access for npm dependencies and pinned native components. Offline builds are possible only after those inputs have been cached. App use itself is local. See [privacy and permissions](PRIVACY.md) and [local captions](LOCAL-CAPTIONS.md).

## Build

The only public package command is:

```sh
npm ci
npm test -- --maxWorkers=2
npm run docs:check
npm run i18n:check
npm run build:native:demo
npm run build:replica
```

A prior engine workflow does not qualify this product package. The clean Replica clone passed install, docs/localization, TypeScript, and Replica Vite checks; see [BUILDING.md](BUILDING.md) for the exact scope and shared-engine test coverage. The current package is ad-hoc signed with runtime flags and is not notarised. The single saved-project reopen and GIF flow is recorded above; exact trim/zoom placement and full workflow acceptance remain pending. The five named MIT notice-provenance gaps above hold binary distribution. Never bypass macOS security or approve an OS permission on another person's behalf.

## Screen Studio reference and attribution

- The [Screen Studio public guide](https://screen.studio/guide) informed the visible workflow. Its guide images were undated and are not included. The recreated shell uses original layout/style work and shared licensed engine code; it does not claim full Screen Studio parity.
- The engine is pinned to [OpenScreen](https://github.com/getopenscreen/openscreen/tree/d8bf2d8138cc2ce2c6542549853260f716cb8fb6), MIT copyright Siddharth Vaddem and contributors. Other components keep their own terms. Read [third-party notices](THIRD-PARTY-NOTICES.md), [license](LICENSE), and [asset provenance](ASSETS.md).

No vendor guide images or Screen Studio recordings are included. No public download is available as of 25 October 2026.
