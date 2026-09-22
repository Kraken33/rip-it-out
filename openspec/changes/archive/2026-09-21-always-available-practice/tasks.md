# Tasks

## 1. Store Fallback Helper Implementation

- [x] 1.1 Add `getPracticeCards(requestedLimit = 20, fallbackLimit = 5)` helper in `src/store.js` that returns due cards when available, or falls back to top upcoming SRS cards sorted by scheduled review date when zero cards are due today. Verify with unit tests in `src/__tests__/srs.test.js` or `src/__tests__/store.test.js`.

## 2. Practice & Review Screen Fallback Integration

- [x] 2.1 Update `src/screens/Practice.jsx` to retrieve practice cards using `getPracticeCards()`. Fallback to top 5 upcoming constructions when 0 cards are due today, showing empty state only when 0 total cards exist in the vault. Verify by running component tests.
- [x] 2.2 Update `src/screens/Review.jsx` to retrieve cards using `getPracticeCards()`. Fallback to top 5 upcoming constructions when 0 cards are due today, allowing manual SRS rating. Verify by running component tests.

## 3. Verification & Testing

- [x] 3.1 Run Vitest test suite (`npm run test`) to confirm all unit and component tests pass without errors when 0 cards are due.
