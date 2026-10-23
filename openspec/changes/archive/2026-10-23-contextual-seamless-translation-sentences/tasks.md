# Tasks

## 1. Prompt Enhancement and Test Coverage

- [x] 1.1 Update unit tests in `src/__tests__/aiService.test.js` to assert that `generateTranslationSentence` requires conversational dialogue/reaction context, explicitly forbids bare 2–4 word isolated translations in a vacuum, and verify that the new assertions fail against the unupdated prompt.
- [x] 1.2 Update `generateTranslationSentence` in `src/services/aiService.js` to include the conversational dialogue/reaction instruction and bare-translation prohibition rules, and verify all tests in `src/__tests__/aiService.test.js` pass.

## 2. Regression and Integration Verification

- [x] 2.1 Run the translation practice and AI service test suite (`src/__tests__/TranslationPracticeSession.test.jsx`, `src/__tests__/Practice.test.jsx`, `src/__tests__/aiService.test.js`) using `npm test` and verify zero regressions.
