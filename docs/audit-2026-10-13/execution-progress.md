# Execution ledger — plan: docs/superpowers/plans/2026-10-13-project-improvements.md

User approved tasks 1 and 2 sequentially on 2026-10-13. Tasks 3–8 remain outside this execution.

Ruling: apply these reversible edits in the user's existing checkout — the user asked to start here, the working tree contains only our audit artifacts, and no Git history/branch mutation is needed. No commit, push, schema migration, or deployment in this run.

Ruling: use this portable Markdown ledger rather than Bash-only SDD scripts — Windows PowerShell and the plan's Uzbek task headings are the current environment; progress and verification remain recorded here.

Pre-flight: tasks 1 and 2 share TodayPage, WordFilters/button sizes and the stepper modal. Task 1 changes layout only; task 2 changes saving/mastery and review. App remains the sole global stepper owner.

Task 1: in progress. RED evidence from audit: two open dialogs, 640 px document width 772 px, 18–36 px mobile controls. These low-impact layout edits use browser verification; no source-string or mirrored tests are added.

Task 1: complete — build exit 0; browser widths 320/390/640/768/1024/1280 have no document overflow, exactly the appropriate nav is visible; Today controls at 320/390 have no targets below 44×44; Words add opens one dialog, Escape closes it and restores body scrolling. Evidence: task1-mobile-today.jpg.

Task 2: in progress. Saving/mastery regressions use Vitest RED→GREEN; UI concealment, restart and cache refresh use real browser flows. Cloud atomicity and old fabricated statistics remain for tasks 3–5.

Ruling: propagate local write failures now — awaiting a swallowed storage exception would still report false success in task 2. Startup seeding may fall back to in-memory demo data. Atomic multi-record writes remain task 4; a partial schedule/log write still requires that transaction work.

Ruling: when the offline UZ→EN exercise has no translated sentence, ask for the stored Uzbek meaning and accept the English target — hiding the old English context otherwise made the task unanswerable. A sentence dictation no longer accepts only its target word. Both defects have RED→GREEN tests; verified AI sentence translation remains task 5.

Ruling: choosing an automatically selected mnemonic does not prove recognition, and a typed conversation does not prove pronunciation — new stepper recognition defaults false; conversation reviews update writing only. Explicit listening/speaking confirmations remain explicit self-checks.

Task 2: implementation and browser verification complete; final independent review pending. RED: 10 original behavior failures, then 2 storage rejection failures and 2 offline exercise failures. GREEN: 30 tests across 4 files. Browser: dictation target/text hidden until answer, badge 3→2→1→0 after successful saves, completion restart fetches an empty fresh queue, empty CTA reaches /words, skipped stepper confirmations produce 0/4 mastery.

2026-10-14: resumed after interruption. Independent review completed; one Important finding: rescue mnemonic could reveal the target before the answer. Rendered-page tests reproduced all three affected exercise types (dictation, UZ→EN, gap-fill); now the clue is gated on isAnswerSubmitted.

Final: Ruling: classify 36 px tablet small controls as a task-1 alignment issue — the touch navigation remains active until 1024 px, so keep 44 px controls until that same breakpoint; 36 px applies only on desktop.

Final review deferred scope: atomic writes, idempotency, cloud auth/schema/account isolation (task 4); fabricated analytics and full FSRS fields (task 3); heuristic assessment/AI keys (task 5); existing dialog focus and delete-error UX (task 6). No new Critical/Important issue beyond the rescue clue was found.

Task 2: complete — 2026-10-14. Rescue clue tests: three RED failures → GREEN; entire suite 34/34 across 5 files. Final build exit 0; diff --check exit 0. Windows sandbox temporary-module ENOENT prevented two sandbox suite runs; the approved run outside sandbox passed all 34. Existing large-bundle warning remains task 7.

Final UI check: 768 px content width 753 px, no visible buttons below 44×44; 390 px light/dark screenshots saved. Independent review completed with its one Important finding fixed and covered by tests. No remaining findings within tasks 1–2. Tasks 3–8 are not marked complete.

Final verification reopened: server cleanup revealed a browser React "Expected static flag was missing" error from the review transition on 2026-10-13. Choose/Dictation returned before their own hooks when the store's exercise became null or changed type. Keep hooks unconditional, with effects gated to the active exercise; verify fresh browser transitions and repeat final tests/build.

Final verification complete: the same conditional-hook pattern was removed from HookStep. Fresh browser flows Choose → UZ→EN → summary, Dictation → summary, and HookStep open → cancel produced no console errors. Final suite 34/34 PASS; final build exit 0. This closes tasks 1 and 2. Real cloud transactions/rollback remain untested and assigned to task 4; bundle warning remains task 7.

Speech first stage: complete — 2026-10-14, separately authorized by the user. Raw transcription, optional AI suggestion and explicit confirmation are separate; session cancellation protects manual edits/new recordings. Plan: `docs/superpowers/plans/2026-10-14-speech-confirmation.md`. Final suite 56/56 in 10 files; build and diff check exit 0. Independent review found no material findings. Browser fixture verified editing/selection/confirmation/cancellation and 320/390/768 px layouts. Full evidence and limits: `speech-confirmation-verification.md`; screenshot: `speech-confirmation-mobile.png`. No real-audio accuracy claim, external API test, deployment or changes to audit tasks 3–8.

Speech audio packages: complete — 2026-10-14, explicitly authorized by the user. Installed and integrated VAD/Silero + ONNX Runtime, local lazy model assets, mono 16 kHz WAV preparation, padded outer trimming, no-speech checks, deadlines/cancellation and visible fallbacks. Final suite 72/72 in 13 files; production build/diff check exit 0; npm audit 0 vulnerabilities. Independent reviewer found no blockers. Browser model/WASM and synthetic-negative/cancellation checks passed. Details, package sizes and unmeasured Uzbek acoustic accuracy: `speech-audio-packages-verification.md`.

Today simplification: complete — 2026-10-15, user chose simplifying the existing design. Due reviews now precede a compact add form; repeated quota/status panels were replaced by one daily goal, with truthful loading/error states. Voice settings use an accessible native dialog; speech confirmation/save guards remain. Final suite 77/77 in 14 files; production build and diff check exit 0. Browser checks covered 320/390/768/1280 px, goal persistence/bounds, navigation, catalog, keyboard dismissal/focus and light/dark appearance; final warning/error log empty. Independent reviewer found no actionable findings. Evidence and scope: `today-simplification-verification.md`. The existing bundle warning and original audit tasks 3–8 remain open.

Uzbek compound spelling: complete within bounded scope — 2026-10-15. User reported `choyxona` → `Choy Khana` with no AI suggestion. Added an offline spelling-suggestion pass for ten known `-xona` compounds and limited inflections, preserving raw text and explicit acceptance; English and unlisted names are not subject to this local pass. Eight initial expected regression failures; final suite 92/92 in 14 files, production build/diff check exit 0. Real component/browser text fixture verified original → suggestion → explicit confirmation; independent review found no actionable findings. Evidence: `uzbek-compound-spelling-verification.md`. This does not establish acoustic improvement, fix all Uzbek recognition errors, or deploy the change.
