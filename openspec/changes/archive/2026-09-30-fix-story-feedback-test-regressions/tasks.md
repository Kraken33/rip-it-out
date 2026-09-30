# Tasks

## 1. Safe Feedback Card Rendering & AI Service Tests

- [x] 1.1 In `src/screens/TranslationStorySession.jsx`, guard `feedback.constructions` with safe array fallbacks `(feedback.constructions || [])` in `StoryFeedbackCard`; verify with component rendering tests.
- [x] 1.2 In `src/__tests__/aiService.test.js`, update `evaluateTranslationStory` prompt assertions to remove the obsolete `"constructions"` expectation and verify `npx vitest run src/__tests__/aiService.test.js` passes.

## 2. Align Story Session Component & Integration Tests

- [x] 2.1 In `src/__tests__/TranslationStorySession.test.jsx`, update the test assertions to verify feedback summary, improved version, and "Natural as-is" states without asserting obsolete per-round construction elements; verify `npx vitest run src/__tests__/TranslationStorySession.test.jsx` passes.
- [x] 2.2 In `src/__tests__/Session.test.jsx`, update story-translation flow assertions to wait on `data-testid="story-feedback"` or summary text rather than `Constructions from this round`; verify `npx vitest run src/__tests__/Session.test.jsx` passes.

## 3. Full Suite Verification

- [x] 3.1 Run `npm test` across all 21 test files and verify all 240 tests pass with zero failures.
