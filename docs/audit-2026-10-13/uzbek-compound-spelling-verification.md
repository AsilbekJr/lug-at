# Uzbek compound spelling suggestion — 2026-10-15

The user supplied a screenshot: they said `choyxona`, but the recognizer returned `Choy Khana` and the correction stage reported no suggestion. No original audio was supplied, so the acoustic error cannot be reproduced or attributed to a particular provider from the screenshot alone.

## Investigation and bounded fix

Both recorder/Whisper and browser recognition feed the shared correction service. Before this change that service depended entirely on remote model output, and accepted `suggestion: null` without a local spelling check. VAD/audio preparation does not resolve this orthographic failure. The existing unrelated phonetic-replacement helper is not used here: applying its replacements silently would violate raw-transcript preservation.

`speech-normalizer.ts` now first proposes spelling for a small allowlist of ten Uzbek `-xona` compounds: choyxona, oshxona, ishxona, dorixona, shifoxona, kasalxona, mehmonxona, yotoqxona, kutubxona and qahvaxona. It handles horizontal separators, `khana`/`khona`/`xana`, and limited case/plural/possessive endings. It preserves surrounding text and punctuation. Unicode word boundaries prevent rewriting inside another word; commas/newlines are not joined. All-uppercase input remains uppercase. This pass applies only to `uz-UZ` and returns before remote requests. Other inputs retain the existing AI path.

This is a bounded orthographic suggestion, not an Uzbek dictionary or general speech-recognition fix. A brand/name can share a known compound spelling, so the raw recognizer text remains visible and selected by default. The user explicitly selects/edits and confirms the suggestion. The review label now says `Tuzatish taklifi` rather than incorrectly describing every suggestion as AI-generated. No recognizer, dependency, upload behavior, credentials or persistence was changed.

## Evidence

- Before implementation, seven spelling/offline regression cases and one rendered-label assertion failed as expected; sixteen existing/negative cases passed. After implementation, all 24 targeted tests passed.
- Final full suite: **92 tests in 14 files**, exit 0. Coverage includes this screenshot text, embedded phrases, common inflections, uppercase, offline behavior, English isolation, names, punctuation/newline boundaries and already-correct words. Earlier confirmation/cancellation tests remain green.
- Final production build: exit 0. Existing bundle warning remains (main JS 1,947.30 kB / gzip 523.98 kB).
- `git diff --check`: exit 0.
- Actual 390 px browser fixture called the real spelling service on `Choy Khana`, rendered the real confirmation component with `Choyxona`, kept raw selected initially, then selected and confirmed `Choyxona`. No horizontal overflow; no warning/error console entries. Screenshot: `choyxona-spelling-mobile.png`.
- Independent read-only reviewer found no actionable findings within this scope.

The fixture is explicitly a text regression test, not a microphone demonstration: `speech-spelling-fixture.html` and `.tsx`. No live transcription, real audio corpus, API-key transmission, deployment or recognition accuracy percentage was tested. There is no basis to promise all similar acoustic errors are gone or to give a date for error-free recognition.

References consulted: [Groq speech-to-text documentation](https://console.groq.com/docs/speech-to-text), [Groq API reference](https://console.groq.com/docs/api-reference), [choyxona spelling](https://izoh.uz/word/choyxona). No provider change was needed for this bounded fix.
