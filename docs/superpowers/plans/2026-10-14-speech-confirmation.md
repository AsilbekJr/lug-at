# Speech confirmation implementation plan

> Implement inline using superpowers:executing-plans; perform one independent final review.

**Goal:** Preserve recognizer output and require explicit acceptance before using speech in Quick Add.
**Architecture:** A session controller owns each recorder, stream and abort controller. The React hook subscribes to its snapshots. A separate review panel presents raw text, optional AI suggestion and an editable selection.
**Tech stack:** React, TypeScript, MediaRecorder / browser SpeechRecognition, existing Groq and Gemini clients, Vitest.
**Spec:** User-approved first stage: raw transcript, suggested correction, explicit confirmation, and protection from stale requests. No model migration or acoustic accuracy guarantee.

## Constraints and review focus

- Keep existing task 1/2 edits and work in the current checkout; no commit, push or deployment.
- Never silently replace raw speech, English input, or confirmed/manual text with phonetic rules.
- New recording, manual edit, language switch, cancellation and unmount invalidate old callbacks.
- Late microphone permission must release its stream; stopping one session cannot stop another recorder.
- Failed/empty recognition is visible; failed correction still permits accepting raw speech.
- Mobile controls are at least 44px and wrap without horizontal overflow.
- Audio stays in memory; no recording or cloud transcription of the user's microphone during verification.

### 1. Session and provider boundaries
- [x] Write tests for raw retention, explicit confirmation, cancellation during recognition/correction/permission, recorder ownership, empty/failing responses and browser fallback.
- [x] Implement `SpeechCaptureController`, its external browser adapter and the hook subscription. Add request cancellation and finite timeouts to provider clients.
- [x] Make AI normalization a conservative optional suggestion; validate its structured response and keep raw text on failure.
- [x] Test that translation receives confirmed text without applying speech corrections again.
- [x] Run targeted tests through RED→GREEN.

### 2. Confirmation interface
- [x] Add `SpeechTranscriptReview` and integrate it with TodayPage. Confirmation fills the main input; adding remains a separate action.
- [x] Main input edits cancel pending speech; saving and language/type controls obey capture state.
- [x] Verify actual panel selection/edit/confirm/cancel and mobile layout in a local browser fixture without using a microphone.

### 3. Verification
- [x] Run full Vitest suite, production build, diff check and independent review; address material findings.
- [x] Record evidence and state that Uzbek acoustic accuracy still requires real recorded samples.

Verification: 56/56 tests in 10 files; `npm run build` exit 0; `git diff --check` exit 0. Evidence and limits: `docs/audit-2026-10-13/speech-confirmation-verification.md`.
