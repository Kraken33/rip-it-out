# Tasks

## 1. Prompts & AI Service Updates

- [x] 1.1 Update `generateFrequencyDrillPrompt` in `src/prompts.js` to strictly anchor variations to the target phrase/construction and forbid replacing it with synonyms, verifying with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.2 Update `evaluateFrequencyDrillPrompt` in `src/prompts.js` to support study direction (`ru-en` vs `en-ru`) and evaluate learner attempts against the target sentence without vocabulary drift, verifying with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.3 Update `evaluateFrequencyMiniDrill` and `generateFrequencyMiniDrill` in `src/services/aiService.js` to handle study direction and anchored target phrases, verifying with tests in `src/__tests__/aiService.test.js`.

## 2. Interactive Session UI & Two-Phase Flow

- [x] 2.1 Refactor `FrequencyPracticeSession.jsx` drill state to start Phase 1 direct sentence recall immediately upon rating `Again` or `Hard` without waiting for an AI generation spinner.
- [x] 2.2 Implement direction-aware drill labels, placeholders, and speech recognition in `FrequencyPracticeSession.jsx`.
- [x] 2.3 Add "Try Variation Drill" action post-evaluation in `FrequencyPracticeSession.jsx` to transition to Phase 2 anchored generation.
- [x] 2.4 Update unit and interaction tests in `src/__tests__/FrequencyPracticeSession.test.jsx` to verify Phase 1 immediate recall and Phase 2 variation transitions.

## 3. Full Suite Verification

- [x] 3.1 Run `npm test` to verify all test suites pass with zero regressions.
