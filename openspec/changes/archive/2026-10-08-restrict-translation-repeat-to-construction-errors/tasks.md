# Tasks

## 1. Prompt #5 Updates

- [x] 1.1 Update `generateTranslationPracticePrompt` in `src/prompts.js` with explicit REPEAT and ADVANCE rules restricting repetitions solely to errors in the target construction itself while advancing on unrelated sentence mistakes.
- [x] 1.2 Update unit tests in `src/__tests__/prompts.test.js` to assert the new repeat restriction and advance guidance, and verify with `npx vitest run src/__tests__/prompts.test.js`.

## 2. In-App Evaluator Prompt

- [x] 2.1 Update `evaluateTranslationRound` in `src/services/aiService.js` to instruct the AI that errors in other parts of the sentence must not cause the target construction's quality to be marked as awkward.
- [x] 2.2 Update unit tests in `src/__tests__/aiService.test.js` to assert the new evaluation prompt instruction, and verify with `npx vitest run src/__tests__/aiService.test.js`.

## 3. Integration Verification

- [x] 3.1 Run the full test suite (`npm test`) to verify zero regressions across all practice and evaluation suites.
