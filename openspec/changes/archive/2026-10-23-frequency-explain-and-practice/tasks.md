# Tasks

## 1. AI Prompts and Service Layer

- [x] 1.1 Implement `generateSentenceDeepStudyPrompt` and `parseSentenceDeepStudy` in `src/prompts.js` for unified explanation, examples, and practice payload, and verify with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.2 Implement `generateSentenceExampleVariationsPrompt` and `parseSentenceExampleVariations` in `src/prompts.js` for on-demand example generation, and verify with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.3 Implement `evaluatePracticeExercisePrompt` and `parsePracticeExerciseEvaluation` in `src/prompts.js` supporting both translation and cloze exercises, and verify with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.4 Implement `getSentenceDeepStudy`, `generateAdditionalSentenceExamples`, and `evaluatePracticeExercise` in `src/services/aiService.js`, and verify with unit tests in `src/__tests__/aiService.test.js`.

## 2. Explain & Practice Modal Component

- [x] 2.1 Create `src/components/ExplainPracticeModal.jsx` with tabbed layout (`Explanation`, `Examples`, `Practice`) and initial unified data fetching with in-memory caching.
- [x] 2.2 Implement the "Explanation" tab rendering overall meaning, vocabulary & grammar breakdown table, usage notes, and pronunciation audio playback.
- [x] 2.3 Implement the "Examples" tab rendering contextual examples with audio playback and "Generate More Examples" button.
- [x] 2.4 Implement the "Practice" tab supporting both translation drills (text & speech-to-text via `AudioRecorder`) and fill-in-the-blank cloze exercises, with AI evaluation feedback, "Retry", and "Try Another Exercise" actions.
- [x] 2.5 Add component tests for `ExplainPracticeModal.jsx` in `src/__tests__/ExplainPracticeModal.test.jsx` verifying tab switching, caching, and exercise interaction.

## 3. Frequency Practice Session Integration

- [x] 3.1 Update `src/screens/FrequencyPracticeSession.jsx` card view to display the "Explain & Practice" button upon revealing translations.
- [x] 3.2 Update rating handlers in `src/screens/FrequencyPracticeSession.jsx` so `Hard` and `Again` save to SRS and immediately advance to the next sentence without forcing a drill.
- [x] 3.3 Connect `ExplainPracticeModal` to `FrequencyPracticeSession.jsx` with session-level caching.
- [x] 3.4 Update `src/__tests__/FrequencyPracticeSession.test.jsx` to verify the updated triage behavior and modal opening.

## 4. End-to-End Verification

- [x] 4.1 Run full project test suite (`npm test`) and verify all tests pass with zero regressions.
