# Tasks

## 1. Prompt Enhancements & Zero-Drift Locking

- [x] 1.1 Update `generateSentenceDeepStudyPrompt` and `generateSentenceExampleVariationsPrompt` in `src/prompts.js` to enforce strict target construction locking (forbidding synonym drift like "cry" for "wept"), require newly authored contextual sentences (6–12 words) for translation drills, and format direction-aware cloze blanks.
- [x] 1.2 Update `evaluatePracticeExercisePrompt` in `src/prompts.js` to support evaluating against contextual drill sentences while honoring root card construction anchors.
- [x] 1.3 Add unit tests in `src/__tests__/prompts.test.js` validating target keyword locking, contextual translation drill prompts, and direction handling, and verify with `npm test -- src/__tests__/prompts.test.js`.

## 2. AI Service & Direction Wiring

- [x] 2.1 Update `getSentenceDeepStudy` and `generateAdditionalSentenceExamples` in `src/services/aiService.js` to accept `direction` parameter and thread it to prompt generators.
- [x] 2.2 Update unit tests in `src/__tests__/aiService.test.js` verifying `direction` propagation and verify with `npm test -- src/__tests__/aiService.test.js`.

## 3. UI Component & Cache Updates

- [x] 3.1 Update `ExplainPracticeModal.jsx` to accept `direction` prop, incorporate `direction` into cache keys (`${sentence.ru}::${sentence.en}::${direction}`), and display contextual sentences and target-language cloze blanks properly.
- [x] 3.2 Update `FrequencyPracticeSession.jsx` to pass `direction` to `ExplainPracticeModal`.
- [x] 3.3 Update `src/__tests__/ExplainPracticeModal.test.jsx` to cover direction-aware cloze rendering, contextual translation prompts, and cache isolation across directions, and verify with `npm test -- src/__tests__/ExplainPracticeModal.test.jsx`.

## 4. Integration Verification

- [x] 4.1 Run full test suite and build verification via `npm test` and `npm run build` to ensure clean compilation and zero regressions across all test suites.
