# Tasks

## 1. Dynamic Manythings Streaming Service

- [x] 1.1 Create `src/services/manythingsService.js` implementing dynamic `<script>` tag loading of `https://www.manythings.org/bilingual/rus/{page}.js`, tab-delimited parsing, and 1-to-1 English-Russian sentence deduplication. Verify with unit tests in `src/__tests__/manythingsService.test.js`.
- [x] 1.2 Implement error handling, timeout recovery, and page boundary checks in `manythingsService.js`. Verify with tests simulating network failure and malformed payloads.

## 2. AI Mini-Drill Prompts and Evaluation

- [x] 2.1 Add `generateFrequencyDrillPrompt` and `evaluateFrequencyDrillPrompt` functions to `src/prompts.js` to create targeted pattern variations and score translation attempts. Verify with unit tests in `src/__tests__/prompts.test.js`.
- [x] 2.2 Add `generateFrequencyMiniDrill` and `evaluateFrequencyMiniDrill` helper methods to `src/services/aiService.js`. Verify with unit tests in `src/__tests__/aiService.test.js`.

## 3. Persistence and SRS Triage Integration

- [x] 3.1 Implement persistence helpers for frequency practice progress (`getFrequencyProgress`, `saveFrequencyProgress`) in `src/store.js` or dedicated utility. Verify with unit tests.
- [x] 3.2 Add helper function to save Good/Hard/Again sentences into the SRS improvement queue under a dedicated frequency session. Verify with unit tests.

## 4. Frequency Practice Screen & Mini-Drill UI

- [x] 4.1 Create `src/screens/FrequencyPracticeSession.jsx` featuring the flashcard front/back view, audio playback buttons (Web Speech / TTS), prompt direction switcher, and Easy/Good/Hard/Again action buttons.
- [x] 4.2 Build the interactive AI mini-drill drawer/sub-view inside `FrequencyPracticeSession.jsx` supporting both text input and microphone recording (Whisper STT), instant AI verdict display, "Try another drill", and "Continue".
- [x] 4.3 Add component unit tests for `FrequencyPracticeSession.jsx` in `src/__tests__/FrequencyPracticeSession.test.jsx` testing card flips, triage branching (Easy vs Good vs Hard), and mini-drill cycles.

## 5. Navigation & Entry Point Integration

- [x] 5.1 Register the `/frequency-practice` route in `src/App.jsx`. Verify route renders and header/nav responds appropriately.
- [x] 5.2 Add a Frequency Practice card to `src/screens/Dashboard.jsx` and `src/screens/Practice.jsx` displaying current page progress and one-click launch. Verify with tests.

## 6. Verification and Polish

- [x] 6.1 Run full unit and component test suites (`npm run test`) and linter (`npm run lint`), ensuring all existing and new tests pass cleanly.
