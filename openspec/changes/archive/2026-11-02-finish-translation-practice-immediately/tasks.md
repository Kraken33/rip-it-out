# Tasks

## 1. TranslationPracticeSession UI & Finish Flow

- [x] 1.1 Update the top-bar button in `src/screens/TranslationPracticeSession.jsx` to display "Finish Practice" and call `handleFinishSession({ ratedInline: true })`, verifying via `src/__tests__/TranslationPracticeSession.test.jsx`.
- [x] 1.2 Update the session completion banner in `src/screens/TranslationPracticeSession.jsx` to remove the outdated "Ready to rate your recall?" copy and rename its button to "Finish Practice", verifying that it continues to pass `{ ratedInline: true }`.

## 2. Practice Screen Completion Routing

- [x] 2.1 Update `startRating` in `src/screens/Practice.jsx` to ensure that when `options?.ratedInline` is set or when exiting early from translation practice, the flow transitions directly to `setStep('complete')`, bypassing the legacy batch `step === 'rating'` screen.
- [x] 2.2 Ensure session persistence in `Practice.jsx` saves all evaluated rounds and logs activity duration, while unrated active cards are omitted from SRS schedule updates, verifying via unit tests.

## 3. Test Suite Verification

- [x] 3.1 Update tests in `src/__tests__/Practice.test.jsx` that previously clicked "Finish & Rate Recall" and expected the batch "Rate Recall" heading to now expect the "Finish Practice" button and immediate "Session finished" completion view.
- [x] 3.2 Run the full test suite (`npm test`) to verify all translation practice and session flow tests pass without regression.
