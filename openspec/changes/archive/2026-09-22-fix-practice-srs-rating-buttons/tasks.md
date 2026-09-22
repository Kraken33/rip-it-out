# Tasks

## 1. Failing regression tests (TDD red)

- [x] 1.1 Add a component test in `src/__tests__/Practice.test.jsx` that renders `Practice` with mocked store data (SRS cards + improvements), simulates `TranslationPracticeSession` finishing via its `onFinish` callback with practiced improvement objects, and asserts that clicking Hard, Good, or Easy on the Rate Recall step calls `updateSrsCard` with the practiced card's `improvementId` and advances the queue; verify the test FAILS on current code (queue does not advance / `updateSrsCard` called with `undefined`).
- [x] 1.2 Add a component test for the prompt-based path: clicking "I'm Done Practicing → Rate Recall" then rating with Good persists via `updateSrsCard` with a real `improvementId`; verify it FAILS on current code.
- [x] 1.3 Add a unit test in `src/__tests__/srs.test.js` pinning the `processReview` input contract: a real `new`-status SRS card rates cleanly for all scores 1–4 (valid ISO `nextReview`, numeric `intervalDays`/`easeFactor`); verify it passes and documents the expected card shape.

## 2. Fix the practiced-cards → SRS-cards handoff

- [x] 2.1 In `src/screens/Practice.jsx`, rework `startRating(customCards)` to treat `customCards` as improvement records: build the practiced id set from `c.id ?? c.improvementId`, filter the loaded `selectedCards` (SRS cards) to `improvementId`s in that set, and filter `improvements` to the same ids in the same order; verify both filtered lists stay index-aligned by re-running test 1.1.
- [x] 2.2 In the same handler, set both lists together and route to `setStep('complete')` when no practiced improvement has a matching SRS card, otherwise `setStep('rating')` with `setCurrentIndex(0)`; verify with a new test case in `Practice.test.jsx` that a finish with zero matching SRS cards lands on the completion screen, not the rating screen.
- [x] 2.3 Confirm both entry points ("Finish Practice ✓" seamless flow and "I'm Done Practicing → Rate Recall" prompt flow) go through the fixed mapping with no changes needed in `TranslationPracticeSession.jsx`; verify tests 1.1 and 1.2 now PASS.

## 3. Verification

- [x] 3.1 Run the full suite (`npm test`) and confirm every test passes, including the new regression tests and the existing `TranslationPracticeSession.test.jsx` / `Review.test.jsx` suites.
- [x] 3.2 Run `npm run lint` and `npm run build` and confirm both succeed with no new warnings from `src/screens/Practice.jsx`.
- [x] 3.3 Manual smoke check (or happy-dom equivalent): complete a seamless translation session, rate the first card Easy, and confirm the stored SRS card (localStorage `rio_srs_cards` or Supabase `srs_cards`) shows `status: 'reviewing'`, `intervalDays: 4`, and a future `nextReview` for that `improvementId`.
