# Tasks

## 1. Evaluation prompt rules

- [x] 1.1 Rewrite the "Rules" block of the `evaluateTranslationRound` system prompt in `src/services/aiService.js` so grading targets the learner's usage of the target constructions only: (a) classify a target "natural" when the learner used that construction grammatically and appropriately, even if a different construction would be more idiomatic; (b) NEVER propose replacing a target construction with a different one; (c) slash-separated alternatives in a target each count as using it; (d) "better" must demonstrate the same target construction used correctly; (e) the "rewrite" must keep every correctly used target construction as-is and fix only actual errors. Verify by running `npm test -- aiService` with the updated assertions from task 1.2 passing.
- [x] 1.2 Extend the `evaluateTranslationRound` tests in `src/__tests__/aiService.test.js` to assert the system prompt contains the new rules (grade only the target constructions, slash-separated alternatives count, "better" uses the same construction, rewrite preserves correctly used targets) while keeping the existing assertions (passage text, "NEVER invent changes", temperature 0.3, max_tokens 8000); verify with `npm test -- aiService`.

## 2. Regression check

- [x] 2.1 Run the full suite with `npm test` and lint with `npm run lint`; verify no existing tests break (in particular `src/__tests__/TranslationPracticeSession.test.jsx` and `src/__tests__/prompts.test.js`, which exercise the unchanged verdict parser and rendering).
