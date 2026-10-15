# Speech confirmation — 2026-10-14

User approved the first stage of speech reliability work. Raw recognition, optional correction and explicit acceptance are now separate. A correction is never automatically written into Quick Add. Confirmation fills the input; adding is still a separate action.

## Changes

- Each capture owns its stream, recorder, audio chunks, language and abort controller. Cancellation invalidates the session before stopping resources. Late permissions release their streams; old results, errors and recorder callbacks cannot affect a newer capture.
- Manual input edits, restarting, language changes and unmount cancel pending work. Stop no longer uses a timer which could stop another recorder.
- Raw text remains available while a conservative AI spelling suggestion is checked. Users can choose raw, choose the suggestion, edit, confirm, cancel or retry. AI failure leaves raw text usable.
- Speech rules no longer rewrite confirmed/manual input inside translation. Broader translation quality and dictionary matching are unchanged.
- Transcription has a 30-second request deadline; both correction providers share one 15-second deadline. MP4 uploads use an MP4 filename. Unrelated Uzbek prompt examples were removed, including from English requests. No contextual vocabulary was invented.
- Capture/review blocks saving until confirmation/cancellation, and blocks conflicting type/language changes. Main-input editing remains available to cancel speech.

## Verification

- Initial regression run reproduced silent translation rewriting (`navo isiq!` became `navo issiq`). The new session module and review component did not exist, so their initial suites failed to import as expected.
- Provider RED run: all nine tests failed, including missing deadlines, incorrect MP4 extension, unstructured/truncated correction output and ignored cancellation. Targeted GREEN: 20 service tests, then two panel rendering tests passed.
- Final `node node_modules/vitest/vitest.mjs run`: **56/56 tests in 10 files**, exit 0 (22 new tests, 34 prior tests).
- Final `npm run build`: exit 0. Existing bundle-size warning remains: JS approximately 1,947 kB / gzip 523 kB, assigned to audit task 7.
- `git -c core.fsmonitor=false -c core.autocrlf=false diff --check`: exit 0.
- Real component browser fixture: choosing raw/suggestion, editing, blank confirmation disabled, confirming edited text, retry, cancellation, correction unavailable, and manual main-input edits all verified. A late suggestion preserved the edited selection and the previous main-input value until confirmation.
- Responsive fixture at 320, 390 and 768 px: no horizontal overflow; 320/390 checks found no buttons below 44×44 px. Screenshot: `speech-confirmation-mobile.png` (390 px fixture, not a real recorded recognition result).
- Actual TodayPage: typed text remained present across UZ→EN microphone-language change; Add enabled for nonempty manual text. No warning/error console entries in the tested page/fixture flows.
- Independent read-only reviewer found no Critical, Important or actionable Minor findings. Initial reviewer model could not start because of its usage limit; a separate available reviewer completed the review. No second review was requested.

## Review limits and next evidence

- Actual Uzbek acoustic accuracy, accents, noise, silence hallucinations and dialect quality were **not measured**. No microphone recording or cloud transcription was performed during verification. The fixture uses declared sample text.
- Live provider availability, quotas and correction quality were not tested. Request fields were checked against [Groq structured output documentation](https://console.groq.com/docs/structured-outputs), [Groq reasoning configuration](https://console.groq.com/docs/reasoning) and [Gemini API reference](https://ai.google.dev/api/generate-content).
- Text-only correction cannot recover certainty from ambiguous audio. This stage makes errors visible and prevents silent acceptance; it does not guarantee that “torsli ko‘cha” will always be recognized as “toshli ko‘cha”.
- Next accuracy work needs representative, consented Uzbek recordings with reference text. Compare raw recognition and proposed correction separately, measure word/phrase error and latency, then decide on vocabulary hints or another model.
- Key storage/backend architecture, cloud transaction correctness, broader translation heuristics and other audit tasks remain outside this stage. No commit, push or deployment was performed.
