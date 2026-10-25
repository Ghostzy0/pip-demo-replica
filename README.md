# Pip Demo Replica

Pip Demo Replica is an experimental local macOS screen recorder and demo-video editor. It uses an original neutral interface and a shared engine derived from MIT-licensed OpenScreen code. Its layout and workflow are a **partial recreation based on undated public Screen Studio guide material**; exact Screen Studio 4.1 UI, capture behavior, algorithms, and export equivalence are not established. This is an independent project with no affiliation or compatibility guarantee.

## Availability and current evidence

Experimental source alpha for local developers. No binary downloads are offered. Binary distribution is held by five MIT notice-provenance gaps for `dlv` 1.1.3, `lazy-val` 1.0.5, `react-remove-scroll-bar` 2.3.8, `block` 0.1.6, and `malloc_buf` 0.0.6. The only supported package profile in this repository is **Demo Replica Core**, version `0.1.0-alpha.1`, bundle ID `uk.pip.demo.replica`, and user-data directory `Demo-Replica`.

The pre-menu-fix clean-export Replica package, identified by its export manifest, passed package-integrity checks: 40 whole-app Mach-O paths were checked, all 36 `LC_RPATH` entries were relative, and deep strict ad-hoc signature verification passed. It passed four headless CLI media exports (control, zoom, voiceover MP4, small GIF). GUI slice one completed import, rename, trim, zoom, Cmd+S save, and MP4 export (1752×1080, nominal 30 fps, 5.666-second container; saved trim 0.752695–1.097605 seconds and zoom 4.653–4.998 seconds). Slice two cold-restored and explicitly reopened the same saved project through File > Open project, then exported a looping 15 fps Small 480p GIF. The project, ranges, timeline, and assets matched slice one. GIF output: 778×480, 85 frames, 5.67 seconds, 4,788,185 bytes; ffprobe and full decode passed. The requested 0.5–1 second trim and 3–5 second zoom placements remain unmet. These runs qualify reopen and GIF export for this one saved project only, not full GUI workflow, capture, ASR, other profiles, Paper theme, reference fidelity, or accessibility technology. Historical 24 October checks: a clean Replica PR export passed `npm ci`, docs/localization, TypeScript, and Replica Core Vite checks; a full Replica suite was not run. A separate Custom PR export passed the shared-engine suite (364 files; 4,953 passed, 2 skipped; 4,955 total) and all three profile Vite builds; it does not establish a full Replica-product suite. Focused RPATH tests passed (27 passed, 1 skipped), and a real temporary macOS Mach-O fixture verified rejection of absolute space-containing `LC_RPATH` values, normalization, relative-path preservation, idempotence, symlink preservation, and strict ad-hoc signature verification. Capture permissions, reference behavior, exact v4 fidelity, accessibility technology, notarization, resource measurements, and full native GUI workflow acceptance remain unverified.

Historical hosted source CI passed for Replica at `d44bc0f3d8c289e3afe2220fcb42fc733d6a2530` on Linux with Node.js 22.22.1/npm 10.9.4 ([run 40173723275](https://github.com/Ghostzy0/pip-demo-replica/actions/runs/40173723275)): 363 test files passed and 1 file skipped; 4,948 tests passed and 7 FFmpeg-dependent tests skipped (4 audio-peak, 3 audio-extraction; 4,955 total) in 144.33s. Type, docs, and i18n checks passed. The corrected workflow built Replica Core (`uk.pip.demo.replica`) and Vite compiled renderer/main/preload bundles; it did not launch the app or build a native package. The immutable public source-alpha Replica tag manifest engine SHA-256 is `3447fde8c6d0dbf40d26ab341f5a181abd835309f5297714641c2d1fb6009b43`; it predates the unreleased menu change above. For that immutable tag, compared with the f019 package-tested export, only `.github/workflows/checks.yml`, `README.md`, and `BUILDING.md` differ; the other 1,433 of 1,436 payload files, including runtime files, are byte-identical. The earlier workflow run built only the foundation profile.


### Cmd-W native close evidence — 25 October 2026

At this native verification checkpoint, the Cmd-W patch had no hosted CI result. The linked CI runs cover earlier source; use the pull request checks for later results on an exact patch head.

The current shared source adds the standard macOS File > Close / Cmd-W route. The published source-alpha tags remain unchanged; `EXPORT-MANIFEST.json` in a clean export identifies later source. Three focused test files passed (23 tests), and TypeScript passed on Node.js 22.22.1. A fresh Pip Plus package was built and tested in two bounded native slices. In the first, Cmd-W quit an empty editor with app processes checked absent before the next accessibility query; after relaunching a synthetic project, a renamed title and 0–345 ms zoom range persisted in project data and Cmd-W closed normally. In the second (105.18 seconds), an unsaved text annotation showed Unsaved; Cmd-W opened Save Changes, and Cancel retained the editor and text. After replacing the text with a second label, Cmd-W then Save & Continue closed the app with processes absent before the next accessibility query. Saved project data contained the exact second label; after relaunch/reopen it rendered in the project. Cmd-Q also exited normally. This evidence applies to Pip Plus only; no Replica package was built or natively tested with the change. Discard and other unsaved-state flows were not exercised. The Pip Plus test bundle also contained a private camera-asset cache-provenance receipt absent from the source export. It remains a local test input, not a redistribution candidate; a future binary must omit that receipt, be resealed, and pass package-integrity and signature checks again. Advisory: when the textarea lost focus as the modal opened, the background status changed from Unsaved to Saved while the modal remained visible, and generic copy said the project was not yet saved despite existing saved-project data; this did not block the tested flow. The native checkpoint did not rerun the full suite; hosted results for later exact refs are tracked in [GitHub Actions](https://github.com/Ghostzy0/pip-demo-replica/actions). The public tags and releases were not changed. Five MIT notice-provenance holds still block binary distribution.

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

A prior engine workflow does not qualify this product package. The clean Replica clone passed install, docs/localization, TypeScript, and Replica Vite checks; see [BUILDING.md](BUILDING.md) for the exact scope and shared-engine test coverage. The pre-menu-fix Replica package was ad-hoc signed with runtime flags and not notarised. The Cmd-W package evidence above is from Pip Plus only and does not qualify the Replica package lifecycle. The single saved-project reopen and GIF flow is recorded above; exact trim/zoom placement and full workflow acceptance remain pending. The five named MIT notice-provenance gaps above hold binary distribution. Never bypass macOS security or approve an OS permission on another person's behalf.

## Screen Studio reference and attribution

- The [Screen Studio public guide](https://screen.studio/guide) informed the visible workflow. Its guide images were undated and are not included. The recreated shell uses original layout/style work and shared licensed engine code; it does not claim full Screen Studio parity.
- The engine is pinned to [OpenScreen](https://github.com/getopenscreen/openscreen/tree/d8bf2d8138cc2ce2c6542549853260f716cb8fb6), MIT copyright Siddharth Vaddem and contributors. Other components keep their own terms. Read [third-party notices](THIRD-PARTY-NOTICES.md), [license](LICENSE), and [asset provenance](ASSETS.md).

No vendor guide images or Screen Studio recordings are included. No installable app download is available as of 25 October 2026; the experimental source prerelease provides source assets.
