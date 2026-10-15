# Audio preparation packages — 2026-10-14

The user authorized installing useful libraries to reduce speech errors. This bounded change adds audio preparation to the existing recording/transcription flow. It does not replace the recognizer or establish a near-100% Uzbek recognition rate.

## Installed and connected

- `@ricky0123/vad-web@0.0.31`: Silero speech detection using the package's FrameProcessor and Legacy model wrapper.
- `onnxruntime-web@1.30.0`: a single WASM-only inference runtime, loaded lazily when audio is processed.
- Native WebAudio decodes, downmixes and resamples to 16 kHz mono. A tested PCM16 WAV encoder avoids another lossy encoding pass after decoding. Existing MediaRecorder compression is not reversed or recovered.
- Only leading/trailing silence is trimmed, with 800ms onset and 300ms tail padding. Pauses between speech segments stay intact. No gain boost or speculative word replacement is applied.
- Silence/no detected speech, invalid PCM and decoded recordings over 60 seconds are rejected before transcription. Inputs are capped at 10 MiB before decoding. Decoder/model failures fall back visibly to full WAV or the original recording, preserving the existing explicit-confirmation flow.
- Preparation has a 20-second deadline and propagates cancellation. AudioContext closure is triggered by cancellation/deadline; model sessions are released in `finally`. Stale preparation results cannot trigger uploads.

## Local assets and build

`scripts/prepare-speech-assets.mjs` runs on install, dev and build. It copies the package's Legacy ONNX model and the matching ORT `.mjs`/`.wasm` files into generated, ignored `public/speech-vad/`; Vite copies those to production output. No CDN is used for inference. The ONNX and WASM source/output hashes matched.

The ONNX file is 1,807,522 bytes; WASM is 14,239,897 bytes. These assets load on first audio processing, so slow connections may use the visible fallback. They are not embedded in the initial page bundle. New lazy JS chunks total about 71 kB before gzip. The existing large main-bundle warning remains audit task 7.

An optional `vite-plugin-static-copy` installation introduced three high audit findings through `chokidar`/`braces`; it was removed. Asset preparation uses Node's standard library instead. Final dependency tree deduplicates ONNX Runtime to version 1.30.0.

## Verification

- New WAV/trim tests first failed on the missing module, then passed (six tests).
- Three capture/UI tests reproduced missing fallback warnings and misleading API-key error text, then passed after integration.
- Four pipeline tests first failed on the missing adapter, then passed: actual WAV upload bytes/filename/model/language, silence rejection, cancellation before upload, and warning propagation.
- Two decoder resource tests failed before cancellation/deadline closure was added; all three decoder tests then passed.
- Final full suite: **72/72 tests in 13 files**, exit 0 (16 added to the previous 56).
- Final `npm run build`: exit 0, 2,189 modules transformed. Existing main-bundle warning: approximately 1,951 kB / gzip 525 kB.
- Final `npm audit --json`: **0 vulnerabilities**, exit 0.
- `git -c core.fsmonitor=false -c core.autocrlf=false diff --check`: exit 0.
- Actual browser fixture loaded the local Silero/ORT runtime: generated silence produced zero speech spans; a generated 440 Hz tone was rejected as no speech; immediate cancellation reported cancellation; a subsequent session succeeded. No microphone or external audio-transcription call was used.
- Development hot reload exposed a duplicate-root warning in the test fixture. Its HMR cleanup now unmounts the root; final verification uses a fresh page.
- Fresh-page silence/tone/cancellation/restart checks passed with no warning/error console entries. Evidence: `speech-audio-local-test.png`.
- Independent read-only review found no Critical, confirmed Important or actionable Minor findings. It recommended more model-init/inference cancellation coverage and representative positive speech measurements; these are follow-up coverage/measurement work, not evidence of improved acoustic accuracy.

## Limits

Synthetic silence/tone checks verify integration and negative inputs. They do not measure Uzbek speech detection recall or word error rate. Real Uzbek recordings, short/quiet words, accents, background noise, Safari/mobile devices and live Groq transcription were not benchmarked. A VAD may reject quiet/very short speech; users can retry or type manually. Stronger reduction of “toshli” → “torsli” errors requires representative recorded samples and reference text to compare models and settings.

Useful upstream references: [VAD browser setup](https://docs.vad.ricky0123.com/user-guide/browser/), [VAD API](https://docs.vad.ricky0123.com/user-guide/api/), [Groq audio preprocessing](https://console.groq.com/docs/speech-to-text). Groq already downsamples to 16 kHz mono: doing this locally standardizes uploads and enables local VAD, but is not by itself proof of higher transcription accuracy.

No commit, push, deployment or changes to unrelated audit tasks were performed.
