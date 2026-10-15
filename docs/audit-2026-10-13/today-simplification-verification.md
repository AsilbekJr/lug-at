# Today page simplification — 2026-10-15

The user chose simplifying the existing design. This change preserves the visual style and focuses on the Today (Bugun) page, with one small shared-header accessibility fix.

## Changes

- Due reviews appear before the add form. Loading and failed queries have explicit states and retries, rather than showing a false empty queue or zero daily progress.
- A compact word/sentence form retains typing, microphone language selection, transcript confirmation, catalog access and voice settings. Recording, draft and save guards remain in place.
- Repeated quota panels, status badges and promotional copy were removed. One daily goal describes items added, has an accessible progress bar, and supports presets or a custom integer from 8 to 500. Storage failures are visible.
- The daily recommendation is smaller; its learning and audio controls remain available.
- Voice settings use a named native modal dialog with Escape dismissal and focus restoration. Unsupported accuracy/free-service claims were removed. This does not change API-key storage or cloud security.
- Word/sentence controls have minimum 44 px targets. The shared brand link now has a 44 px height and its normal keyboard focus indication.

Main files: `src/app/routes/TodayPage.tsx`, `src/features/words/components/DailyGoal.tsx`, `src/features/words/components/VoiceSettingsDialog.tsx`, `src/components/layout/header.tsx`.

## Verification

- Five rendered-page regression tests first reproduced the missing hierarchy/loading/error/progress behavior, then passed. The full final suite passed: **77 tests in 14 files**, exit 0.
- Final `npm run build` passed, exit 0. The existing large-bundle warning remains: main JavaScript 1,946.89 kB, gzip 523.76 kB. Bundle optimization remains audit task 7.
- Final `git diff --check` passed, exit 0.
- Actual browser widths 320, 390, 768 and 1280 px had no document horizontal overflow. At 320 and 768 px, visible interactive controls measured at least 44 by 44 px after the touch-target adjustments.
- Daily goal changed from 8 to 15, survived reload, rejected 501, and was restored to 8 through the UI.
- Word/sentence and microphone-language toggles preserved typed text. The test input was cleared afterward.
- Review navigation reached a real exercise; the brand link returned home. No review answer was submitted. The topic catalog opened and closed without saving an item.
- Voice settings fit the mobile viewport, exposed a heading and labeled key field, closed with Escape, and returned focus to the opener. Native modal background controls were inert; browser chrome may receive focus at a Tab boundary. No key was entered or saved.
- Light and dark modes were visually inspected; the original light theme was restored. Final browser warning/error log was empty.
- Independent read-only review found no actionable findings within this bounded scope. No new dependency was added for this UI change.

Evidence: `today-simplified-mobile.png`, `today-simplified-dark.png`, `today-simplified-desktop.png`.

No real microphone, transcription API, cloud persistence, deployment or acoustic accuracy measurement was performed in this UI pass. Earlier audit tasks 3–8 are not marked complete by this change.
