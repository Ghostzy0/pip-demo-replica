# Optional local captions

Automatic model downloads and automatic transcription are disabled in both Demo editions. Recording, editing and exporting do not require speech models or an account. Captions can read a transcript already present in a project. A manual transcription requires the native speech helper and matching local models; this optional path is not release acceptance evidence until tested on the packaged build.

## Model paths and pins

These are source-declared pins from `electron/stt/modelManager.ts` at the imported OpenScreen revision `d8bf2d8138cc2ce2c6542549853260f716cb8fb6`. The derivative has not downloaded or independently certified these model artifacts. Review the upstream model terms before choosing to install them.

On macOS, put both files in:

- Baseline: `~/Library/Application Support/Demo-Baseline/stt-models/whisper-ggml/`
- Pip: `~/Library/Application Support/Pip-Demo/stt-models/whisper-ggml/`

| Filename | Pinned source | Required SHA-256 |
| --- | --- | --- |
| `ggml-small-q8_0.bin` | [ggerganov/whisper.cpp, revision 5359861c739e955e79d9a303bcbc70fb988958b1](https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-small-q8_0.bin) | `49c8fb02b65e6049d5fa6c04f81f53b867b5ec9540406812c643f177317f779f` |
| `ggml-silero-v6.2.0.bin` | [ggml-org/whisper-vad, revision 9ffd54a1e1ee413ddf265af9913beaf518d1639b](https://huggingface.co/ggml-org/whisper-vad/resolve/9ffd54a1e1ee413ddf265af9913beaf518d1639b/ggml-silero-v6.2.0.bin) | `2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987` |

Download only if you want this optional feature, then check each file with `shasum -a 256 <filename>` against the table. The app verifies both hashes before loading the models. The first model is approximately 264 MB; the VAD model is approximately 0.9 MB according to the source descriptors. No model download happens in the app. A missing or invalid model produces a model-download-disabled error.

## Native helper and limits

`electron/stt/whisperServer.ts` also requires an executable `whisper-stt-server`; source builds provide `scripts/build-whisper-stt.sh`. Model files alone do not provide the speech engine. Binary availability and model licensing/distribution must be qualified separately for each release. Forced-alignment model downloads are also disabled; cached alignment models may be used, otherwise the engine keeps its own word timings.

After installation, request transcription explicitly from the transcript controls. That starts a temporary loopback speech-helper process. It is separate from MCP: the app does not start an automation HTTP server or app-channel socket. Quit shuts down the speech helper. Cloud translation, provider/account settings and AI Smart Cuts are absent from this edition.
