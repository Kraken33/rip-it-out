# Tasks

## 1. Bug Fix and Verification Tests

- [x] 1.1 Add tests in `src/__tests__/Review.test.jsx` for evaluating cards with SRS rating buttons (Good, Again), asserting that the queue advances to the next card and displays the session complete screen when the queue is finished
- [x] 1.2 Remove the orphaned `setShowExamplesPrompt(false)` call from `handleRating` in `src/screens/Review.jsx` and verify tests pass with `npm test src/__tests__/Review.test.jsx`

## 2. Full Test Suite and Asset Build

- [x] 2.1 Run the full test suite with `npm test` to ensure all 26 test suites pass without regression
- [x] 2.2 Run `npm run build` to update the production bundle in `docs/` and verify the build succeeds
