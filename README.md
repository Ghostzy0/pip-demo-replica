# Pip Demo Replica

Pip Demo Replica is an experimental local macOS screen recorder and demo-video editor. It uses an original neutral interface and a shared engine derived from MIT-licensed OpenScreen code. Its layout and workflow are a **partial recreation based on undated public Screen Studio guide material**; exact Screen Studio 4.1 UI, capture behavior, algorithms, and export equivalence are not established. This is an independent project with no affiliation or compatibility guarantee.

## Availability and current evidence

Experimental source alpha for local developers. No binary downloads are offered. Binary distribution is held by five MIT notice-provenance gaps for `dlv` 1.1.3, `lazy-val` 1.0.5, `react-remove-scroll-bar` 2.3.8, `block` 0.1.6, and `malloc_buf` 0.0.6. The only supported package profile in this repository is **Demo Replica Core**, version `0.1.0-alpha.1`, bundle ID `uk.pip.demo.replica`, and user-data directory `Demo-Replica`.

This exact Replica package passed package-integrity checks as a clean export from ref `ceeba575`: 40 whole-app Mach-O paths were checked, all 36 `LC_RPATH` entries were relative, and deep strict ad-hoc signature verification passed. It also passed four headless CLI media exports: control, zoom, voiceover MP4, and small GIF. A separate partial GUI run on `ceeba575` completed import, rename, trim, zoom, Cmd+S save, and MP4 export. The saved trim range was 0.752695–1.097605 seconds; the zoom range was 4.653–4.998 seconds; the output was 1752×1080 at nominal 30 fps with a 5.666-second container duration. The intended exact trim/zoom placement recipe was not achieved. Reopen and GIF export remain pending. This partial workflow does not establish full GUI acceptance, live capture, or ASR/model execution. On 24 October, the clean remote PR clone at `3774c04` passed `npm ci`, `docs:check`, `i18n:check`, TypeScript checking, and the Replica baseline/core Vite build under Node.js 22.22.1/npm 10.9.4. A full Replica test suite was not run. The clean remote Custom PR clone at `fc14d6a` passed the shared-engine suite (364 files; 4,953 passed, 2 skipped; 4,955 total) and all three profile Vite builds. Historical exports `3774c04` and `fc14d6a` shared normalized engine hash `4ad3c4e…d399013`; the Custom suite does not establish a full Replica-product suite. The initial RPATH fix used focused tests; the hosted source suites recorded below subsequently covered the exported source. At source revision `4a58359`, focused `before-pack.test.mjs` checks passed (27 passed, 1 skipped), and a real temporary macOS Mach-O fixture verified rejection of absolute space-containing `LC_RPATH` values, normalization, relative-path preservation, idempotence, symlink preservation, and strict ad-hoc signature verification. The current normalized shared-engine hash at Replica ref `ceeba575` is `f01935c94e3598165ef60dc4c492b8969a3915b85c8ed4993ca9a1fa9bc033f2`. Capture permissions, current Screen Studio reference behavior, exact v4 fidelity, accessibility-technology testing, notarization, resource measurements, and full native GUI workflow acceptance remain unverified.

Hosted source CI on 25 October passed for this Replica source at `b982753` on Linux with Node.js 22.22.1/npm 10.9.4: 363 test files, 4,948 passed, 7 skipped (4,955 total) in 122.25s; type, docs, and i18n checks passed ([run](https://github.com/Ghostzy0/pip-demo-replica/actions/runs/40172502073)). The seven skips were FFmpeg-dependent (four audio-peak and three audio-extraction checks); native FFmpeg was not fetched. The initial renderer step built only the foundation profile. The corrected declared-profile workflow has not yet had a hosted run, so Replica product-profile CI coverage is still pending.

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

A prior engine workflow does not qualify this product package. The clean Replica clone passed install, docs/localization, TypeScript, and Replica Vite checks; see [BUILDING.md](BUILDING.md) for the exact scope and shared-engine test coverage. The current package is ad-hoc signed with runtime flags and is not notarised. Partial GUI steps are recorded above; reopen, GIF, and full workflow acceptance remain pending. The five named MIT notice-provenance gaps above hold binary distribution. Never bypass macOS security or approve an OS permission on another person's behalf.

## Screen Studio reference and attribution

- The [Screen Studio public guide](https://screen.studio/guide) informed the visible workflow. Its guide images were undated and are not included. The recreated shell uses original layout/style work and shared licensed engine code; it does not claim full Screen Studio parity.
- The engine is pinned to [OpenScreen](https://github.com/getopenscreen/openscreen/tree/d8bf2d8138cc2ce2c6542549853260f716cb8fb6), MIT copyright Siddharth Vaddem and contributors. Other components keep their own terms. Read [third-party notices](THIRD-PARTY-NOTICES.md), [license](LICENSE), and [asset provenance](ASSETS.md).

No vendor guide images or Screen Studio recordings are included. No public download is available as of 25 October 2026.
