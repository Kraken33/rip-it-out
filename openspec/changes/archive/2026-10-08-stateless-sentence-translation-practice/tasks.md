# Tasks

## 1. AI Service & Prompt Generators

- [x] 1.1 Implement stateless `generateTranslationSentence(card, settings)` in `src/services/aiService.js` requesting 1 pure Russian sentence without bracket tags or message history, and verify with unit tests in `src/__tests__/aiService.test.js`.
- [x] 1.2 Update evaluation in `src/services/aiService.js` to assess single-sentence translation against 1 target construction, returning whether the target was used naturally, and verify with unit tests in `src/__tests__/aiService.test.js`.
- [x] 1.3 Update `generateTranslationPracticePrompt` (Prompt #5) in `src/prompts.js` to the lightweight 1-sentence, 1-card format without spoiler tags, and verify with unit tests in `src/__tests__/prompts.test.js`.

## 2. Practice Session UI & Immediate Branching

- [x] 2.1 Update `src/screens/TranslationPracticeSession.jsx` to operate on a 1-construction active queue, render natural Russian text directly without bracket annotations or spoilers, and remove conversation history passing.
- [x] 2.2 Implement immediate evaluation and branching logic in `src/screens/TranslationPracticeSession.jsx` (missed = retry same construction with an immediately generated fresh sentence; natural = mark passed and advance to next card) and verify with unit tests in `src/__tests__/TranslationPracticeSession.test.jsx`.
- [x] 2.3 Update explanatory copy on `src/screens/Practice.jsx` to reflect single-sentence translation practice.

## 3. Integration & Verification

- [x] 3.1 Run the full Vitest suite (`npm test`) to ensure all test suites pass with zero regressions across practice modes, session saving, and SRS transitions.
