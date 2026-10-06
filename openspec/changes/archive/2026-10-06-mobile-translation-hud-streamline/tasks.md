# Tasks

## 1. Russian Translation Practice Session HUD Streamline

- [x] 1.1 Update `src/screens/TranslationPracticeSession.jsx` top session header to `hidden sm:flex` and update the bottom composer bar to hide inline mic and translate button on mobile screens (`< sm`).
- [x] 1.2 Enhance `mobile-practice-actions-panel` in `src/screens/TranslationPracticeSession.jsx` to render round/practiced status in the header, full-width AudioRecorder, full-width `Translate Translation ▶` submit button, Next Round, Finish Practice, and Exit buttons.
- [x] 1.3 Update tests in `src/__tests__/TranslationPracticeSession.test.jsx` to verify mobile HUD elements and ensure `npm test -- src/__tests__/TranslationPracticeSession.test.jsx` passes.

## 2. Russian Translation Story Session HUD Streamline

- [x] 2.1 Update `src/screens/TranslationStorySession.jsx` top session header to `hidden sm:flex` and update the bottom composer bar to hide inline mic and translate button on mobile screens (`< sm`).
- [x] 2.2 Enhance `mobile-actions-panel` in `src/screens/TranslationStorySession.jsx` to render round index and vibe badge in the header, full-width AudioRecorder, full-width `Translate Translation ▶` submit button, Story Flavor Matrix trigger, Next Round, and Finish Story buttons.
- [x] 2.3 Update story session tests in `src/__tests__/TranslationStorySession.test.jsx` (or related test files) to verify mobile HUD actions and ensure story test suites pass.

## 3. Verification & Regression Testing

- [x] 3.1 Run the complete Vitest test suite (`npm test -- --run`) to verify all unit and integration tests pass cleanly without regressions.
