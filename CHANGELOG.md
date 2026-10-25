# Change notes

## Unreleased security and recovery changes — 24 October 2026

- Update Electron to supported 44.9.3 and patch the reviewed high/critical dependency findings. Five low/moderate full-tree findings remain in the audit snapshot; package reachability and native behavior require separate verification.
- Sanitize restored, pasted and saved Notes HTML with DOMPurify and an explicit formatting allowlist; retain supported bold/italic/list formatting.
- Restrict Notes to bundled asset location rather than the editor's native bridge, with sandbox and Chromium web security enabled. Re-enable web security in editor and CLI runner; media/export compatibility is a required package gate.
- Require sender-bound, short-lived, one-use native-file grants for renderer project-path loads, including the generic native bridge. Explicit main-process chooser and parsed CLI paths retain their intended access.
- Verify the selected private evidence archive by safe extraction and all recorded file hashes. Full evidence coverage and cleanup remain pending.

These are development changes, not a published release or final native acceptance.

## 0.1.0-alpha.1, development

Foundation: OpenScreen d8bf2d8138cc2ce2c6542549853260f716cb8fb6 (2.1.2), MIT.

- Add separately identified baseline/Pip build commands and local data directories.
- Remove background usage reporting, upstream updates, cloud provider/chat/translation/Smart Cuts surfaces and automation listeners.
- Protect known recording/video/audio inputs from export destinations, including file aliases.
- Stage project/export writes before publication; failed writes preserve existing destinations. Cross-device rename failure preserves both files rather than copying over the destination.
- Authenticate close-confirm replies and prevent repeated close/save races.
- Replace uncleared default cursor/wallpaper/brand artwork with original licensed geometry.
- Adapt native FFmpeg build staging for checkout paths containing spaces.

Native runtime, packaged regression, independent rendered review and clean-clone release gates remain pending. Development notes are not a release or support guarantee.
