# Tasks

## 1. Core Implementation

- [x] 1.1 Update `generateTranslationSentence` in `src/services/aiService.js` to use `card.explanation` as pattern nuance guidance and remove the `card.improved` example hint
- [x] 1.2 Update unit tests in `src/__tests__/aiService.test.js` to verify `generateTranslationSentence` sends `explanation` when present and omits narrative example sentences

## 2. Regression & Verification

- [x] 2.1 Run `npm test src/__tests__/aiService.test.js src/__tests__/TranslationPracticeSession.test.jsx` to verify all sentence generation and practice session tests pass
- [x] 2.2 Run `openspec validate use-construction-explanation-for-translation-sentences` to verify the change specification is compliant
