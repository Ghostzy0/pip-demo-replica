# Third-party notices

Pip Demo derives from MIT-licensed OpenScreen (see [LICENSE](LICENSE)). The macOS packages additionally
bundle the third-party components below. This file ships inside the
application resources and satisfies the attribution and source-offer obligations
that come with them.

npm dependencies are not listed here. The generated `THIRD-PARTY-LICENSES.txt`
conservatively inventories installed production npm packages; some may not be
present in the final Vite bundle. It ships beside this file.

---

## FFmpeg — shared libraries and CLI (macOS; retained Windows source)

- **macOS components**: dynamically linked `libav*.dylib`, `libsw*.dylib` and the FFmpeg CLI under `resources/electron/native/bin/darwin-<arch>/`. Built from checksum-pinned FFmpeg8.1.2 source by `scripts/fetch-ffmpeg-macos.mjs` without GPL/nonfree options; deployment floor13.0. Replaceable shared libraries, LGPL2.1-or-later, full licence text shipped under `resources/licenses/LICENSE-LGPL-2.1.txt`. Corresponding complete source: <https://ffmpeg.org/releases/ffmpeg-8.1.2.tar.xz>; exact recipe and SHA256 are in the fetch script. The native addon stages loader-relative links, so no build-machine library paths are required.
- **Retained Windows source components** (no Windows package qualified here): `avcodec-*.dll`, `avformat-*.dll`, `avutil-*.dll`,
  `swresample-*.dll`, `swscale-*.dll` and their siblings, under
  `resources/electron/native/bin/win32-*/`.
- **Used by**: the native D3D11 compositor addon, which links against them at
  load time.
- **License**: **GNU Lesser General Public License v2.1 or later**
  (<https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>). FFmpeg's own
  licensing page: <https://ffmpeg.org/legal.html>.
- **This is an LGPL build, not a GPL one.** It is configured without
  `--enable-gpl` and without `--enable-nonfree`, and links no GPL-only library
  (x264, x265, xvid, vidstab, rubberband, frei0r, …). `scripts/fetch-ffmpeg.mjs`
  verifies this before vendoring — it reads `ffmpeg -L`, `-buildconf` and
  `-encoders` and refuses any binary that reports otherwise.
- **Upstream binaries**: BtbN/FFmpeg-Builds, release
  `autobuild-2026-07-31-14-10`, the `*-lgpl-shared-8.1` assets. Pinned by
  SHA-256 in `scripts/fetch-ffmpeg.mjs`; the digests there identify the exact
  artifacts we ship.
  <https://github.com/BtbN/FFmpeg-Builds/releases/tag/autobuild-2026-07-31-14-10>
- **Corresponding source**: FFmpeg n8.1.2, commit `9b6c8969e0`, from
  <https://github.com/FFmpeg/FFmpeg>. The build configuration and scripts that
  produced these exact binaries are published at
  <https://github.com/BtbN/FFmpeg-Builds>.
- **Relinking**: as required by the LGPL, these are dynamic libraries. You may
  replace them with your own build of the same FFmpeg version by overwriting the
  DLLs in `resources/electron/native/bin/win32-*/`.

## web-demuxer — WebAssembly demuxer

- **Component**: `wasm/web-demuxer.wasm`, inside the application bundle.
- **Used by**: the editor's streaming decoder, audio waveforms and caption audio
  extraction, which demux recordings in the renderer with it.
- **License**: MIT for web-demuxer itself — Copyright (c) 2024 ForeverSc, under the
  same permission notice as OpenScreen's own [LICENSE](LICENSE). The module also
  contains FFmpeg code compiled to WebAssembly, under the **GNU Lesser General
  Public License v2.1 or later**, as web-demuxer's README states.
- **Upstream**: the npm package `web-demuxer` 4.0.0,
  <https://github.com/ForeverSc/web-demuxer>. The shipped file is byte-identical
  to that release's `dist/wasm-files/web-demuxer.wasm`.
- **Corresponding source**: the web-demuxer repository at the 4.0.0 release, whose
  `lib/` directory holds the FFmpeg-derived sources and their build scripts.
- **Replacing it**: the module is a separate file loaded at runtime, so it can be
  replaced with your own build of the same version.

## whisper.cpp and ggml

- **Components**: `whisper-stt-server` and its ggml backend sidecars, under
  `resources/electron/native/bin/<platform>-<arch>/`.
- **License**: MIT — <https://github.com/ggml-org/whisper.cpp> and
  <https://github.com/ggml-org/ggml>.
- Built from source by `scripts/build-whisper-stt.sh`; the pinned upstream
  revision is in `electron/native/whisper-stt/CMakeLists.txt`.
- The speech model (`ggml-*.bin`) is **not** bundled. Automatic downloads are disabled in this local edition; see `LOCAL-CAPTIONS.md` for exact manual setup pins.

## ONNX Runtime (Windows and Apple Silicon macOS)

- **Component**: `onnxruntime.dll` / `libonnxruntime.dylib`, under
  `resources/electron/native/bin/<platform>-<arch>/`.
- **License**: MIT — <https://github.com/microsoft/onnxruntime>.
- Not built here: the pinned upstream release archive is downloaded, SHA-256
  verified and unpacked by `scripts/fetch-onnxruntime.mjs`, which also checks the
  archive's own LICENSE really is MIT before vendoring anything.
- **Why it ships**: the native compositor segments the webcam subject with it, on
  the CPU execution provider, to drive the camera background cutout/blur/custom
  modes. The `gpu_cuda*` builds are deliberately not used — they are an order of
  magnitude larger and carry NVIDIA redistribution terms.
- **Not on Intel macOS**: upstream publishes no `osx-x86_64` asset from 1.27 on,
  so the x64 DMG ships without it and the camera background effects are simply
  absent there. Not shipped on Linux either, where the compositor has no capture
  path for the mask yet.
- The segmentation model it runs is a separate component, immediately below.

## MediaPipe Selfie Segmentation — model weights

- **Components**: `selfie_segmentation.tflite`,
  `selfie_segmentation_landscape.tflite` and the `selfie_segmentation_landscape.onnx`
  derived from them, shipped under `resources/mediapipe/`.
- **License**: Apache-2.0 — <https://google.github.io/mediapipe/solutions/selfie_segmentation>.
  Copyright The MediaPipe Authors.
- The `.onnx` is a **derived work**, generated from the vendored `.tflite` by
  `scripts/convert-selfie-segmentation-to-onnx.py`. No third-party weights are
  downloaded at build time.
- **Why it is listed here**: these weights are redistributed inside the installer,
  and Apache-2.0 §4 asks that the attribution travel with them. The provenance note
  in `public/mediapipe/selfie_segmentation/README.md` does not — electron-builder's
  `"!*.md"` filter strips it from the package — so this file is the only copy a user
  ever receives.
- The MediaPipe **JavaScript** solution and its two ~5.6 MB WASM builds are no longer
  bundled: inference moved into the native compositor, and nothing loaded them.

## Microsoft Visual C++ runtime — `vcomp140.dll`, `msvcp140*.dll`, `vcruntime140*.dll` (Windows only)

- **Components**: under `resources/electron/native/bin/win32-x64/` —
  `vcomp140.dll`, `msvcp140.dll`, `msvcp140_1.dll`, `vcruntime140.dll`,
  `vcruntime140_1.dll`.
- **License**: redistributable under the Microsoft Visual C++ Redistributable
  terms accompanying Visual Studio; the copies shipped are taken from the
  `VC\Redist\MSVC\<version>\x64\Microsoft.VC<nnn>.OpenMP\` and
  `…\Microsoft.VC<nnn>.CRT\` directories of the Visual Studio installation that
  builds the release, never from `System32`.
- **Why they ship**: two prebuilt binaries in the payload import them, and
  neither is ours to recompile against the static CRT. The ggml backends above
  are compiled with OpenMP and import `vcomp140.dll`; the vendored ONNX Runtime
  imports the CRT proper. None of these are **part of Windows**, so without them
  `whisper-stt-server` dies in the loader before `main()` on any machine that has
  no Visual C++ Redistributable — transcription and captions fail with no usable
  error — and `onnxruntime.dll` fails to load, leaving the camera background
  silently inert. Staged by `scripts/stage-vcomp-runtime.mjs`;
  `scripts/before-pack.cjs` refuses to package if any is missing while something
  still imports it.

## PipeWire — headers (Linux only)

- **Components**: header sources under
  `electron/native/pipewire-capture/vendor/pipewire-1.0.5/include/`, compiled
  into `openscreen-pipewire-helper` (the Linux cursor/capture helper) under
  `resources/electron/native/bin/linux-*/`.
- **License**: **MIT** — <https://gitlab.freedesktop.org/pipewire/pipewire>.
  Every vendored file keeps its upstream `SPDX-License-Identifier: MIT` header,
  and the project's licence text is copied alongside them as `COPYING`.
- **Upstream**: PipeWire release 1.0.5. Only the header subset the helper
  includes was vendored; `vendor/README.md` records exactly what was copied and
  how to reproduce the selection.
- **No PipeWire binary is redistributed.** The helper resolves
  `libpipewire-0.3.so.0` with `dlopen` at runtime, from the user's own system,
  so nothing of PipeWire's ships inside our installers beyond the compiled
  result of its headers (inline functions and struct layouts).

## Fonts — Inter, Lora, Oswald, Caveat, IBM Plex Mono

- **Components**: the Regular and Bold `.ttf` of each family, under
  `resources/fonts/`.
- **Used by**: the native compositor, which draws captions and annotations with
  these files and nothing else (it registers them privately at start and never
  reads the fonts installed on the machine), and the editor's font picker.
- **License**: **SIL Open Font License 1.1** — <https://openfontlicense.org>.
  Each family's copyright notice and licence text ship beside its files as
  `<Family>-OFL.txt`, as the licence requires.
- **Unmodified**: every file is redistributed exactly as upstream publishes it,
  which is also why the Reserved Font Names "Lora" and "Plex" are kept.
- **Upstream**:
  - Inter — Copyright 2016 The Inter Project Authors. `extras/ttf/` of the v4.1
    release, <https://github.com/rsms/inter/releases/tag/v4.1>.
  - Lora 3.021 — Copyright 2011 The Lora Project Authors. `fonts/ttf/` of
    <https://github.com/cyrealtype/Lora-Cyrillic> at `2d53b449b6`.
  - Oswald 4.103 — Copyright 2016 The Oswald Project Authors. `fonts/ttf/` of
    <https://github.com/googlefonts/OswaldFont> at `89795261ac`.
  - Caveat 2.000 — Copyright 2014 The Caveat Project Authors. `fonts/ttf/` of
    <https://github.com/googlefonts/caveat> at `59745e818e`.
  - IBM Plex Mono 2.3 — Copyright © 2017 IBM Corp. `ofl/ibmplexmono/` of
    <https://github.com/google/fonts> at `23e54b51dd`.

## Recordly — helper code

- **Components**: parts of the zoom, motion-smoothing and custom-cursor code, and a
  few lines elsewhere, the native capture helpers included.
- **License**: MIT — Copyright (c) 2026 webadderall, under the same permission
  notice as OpenScreen's own [LICENSE](LICENSE). Published by Recordly under MIT,
  before its relicensing in March 2026.

## Rust crates — compiled into the compositor addon

- **Component**: `compositor_view.node`, under
  `resources/electron/native/bin/darwin-<arch>/` in these macOS editions.
- **Inventory**: `scripts/generate-third-party-licenses.mjs` reads the locked Cargo
  graph filtered to the exact macOS target (`aarch64-apple-darwin` or
  `x86_64-apple-darwin`). It excludes build dependencies and procedural macros
  that do not reach the addon. The generated `THIRD-PARTY-LICENSES.txt` names
  the target and every included crate; a cross-platform `Cargo.lock` list would
  also name code absent from these packages.
- **Full texts**: package license/NOTICE files are read from the installed crate
  sources. Where an exact-version archive omitted one, an audited source file
  under `licenses/curated/` is used only when its SHA-256 and the crate's
  `Cargo.lock` checksum match `licenses/curated-manifest.json`. The manifest
  records the exact upstream source URL and commit when available. No missing
  copyright holder has been inferred from author metadata.
- **Five declared-MIT source-notice gaps**: exact published versions of `dlv`
  1.1.3, `lazy-val` 1.0.5, `react-remove-scroll-bar` 2.3.8, `block` 0.1.6 and
  `malloc_buf` 0.0.6 expressly declare SPDX MIT but supply no full MIT file or
  explicit copyright-holder line. Their exact archive integrity/checksum and
  source-revision evidence are pinned in the curated manifest. For these five
  only, the generated inventory preserves the published declaration and source
  reference plus the canonical MIT permission, condition and disclaimer from
  SPDX. The replaceable copyright placeholder is omitted; no holder or year is
  inferred from package author metadata. These are labelled declaration-based
  fallbacks, distinct from recovered upstream license files. This records the
  available evidence and is not a claim of legal clearance.
- **Release gate**: any other missing text, changed lock pin or notice hash,
  undeclared or incompatible fallback licence makes the generator fail. A
  private `--allow-incomplete` diagnostic must use a separate output path and
  is marked unqualified.

## Kenney UI Audio — click sounds

- **Components**: `sounds/click-down.wav` and `sounds/click-up.wav`, inside the
  application bundle.
- **Used by**: the editor's "Mouse clicks" option, which plays them on each
  recorded click, in the preview and in the export.
- **License**: **CC0 1.0 Universal** —
  <https://creativecommons.org/publicdomain/zero/1.0/>, as the licence file
  shipped in the pack states. Credit is not required; it is given here anyway.
- **Upstream**: "UI Audio" by Kenney, <https://kenney.nl/assets/ui-audio>.
  `click-down.wav` is its `click3.wav` and `click-up.wav` its `switch12.wav`,
  both trimmed of leading silence and normalised to a 0.7 peak.

## OpenScreen native helpers

`wgc-capture` (Windows Graphics Capture), the ScreenCaptureKit helper (macOS),
the PipeWire helper (Linux) and the compositor addon are part of this repository
and are covered by [LICENSE](LICENSE).

---

To report an omission or request source for anything bundled here, open an issue
at <https://github.com/Ghostzy0/pip-demo/issues>.

## Pip Demo build-time camera weights

The Apache-2.0 derived MediaPipe landscape segmentation ONNX file is retrieved at build time from the exact pinned OpenScreen source revision by `scripts/camera-assets.mjs`, SHA256 `daa5d38991b6a013367a9be88cb03229bb01abeee5129707a70a3987511c9e94`. Full Apache2.0 licence is shipped in `resources/mediapipe/LICENSE-APACHE-2.0.txt`; original provenance/conversion notes remain beside the asset. This small model is bundled for optional camera background effects. It is separate from optional speech weights, which are not bundled or automatically downloaded.
