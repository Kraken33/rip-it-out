# Tasks

## 1. Prompt Generators & Text Annotation Utilities

- [x] 1.1 Add `generateTranslationPracticePrompt(improvements, settings)` (Prompt #5) to `src/prompts.js` for external LLM copy/paste practice, and verify with unit tests in `src/__tests__/prompts.test.js`.
- [x] 1.2 Implement `parseTaggedPassage(text)` in `src/textAnnotator.js` to extract `[[Russian phrase|target construction]]` into structured token segments and verify with unit tests.

## 2. AI Service Streaming & Integration

- [x] 2.1 Add `streamTranslationPracticeCompletion` in `src/services/aiService.js` to support in-app streaming of Russian passages with highlighted constructions and translation feedback.
- [x] 2.2 Verify AI service streaming handling and fallback behavior with unit test assertions.

## 3. UI Components & Navigation

- [x] 3.1 Create `src/screens/TranslationPracticeSession.jsx` to render multi-round passage translation view, highlighted construction badges, voice/text input, and round progress.
- [x] 3.2 Update `src/screens/Practice.jsx` to support toggling between Scenario Practice (Prompt #3) and Translation Practice (Prompt #5 / Seamless AI).
- [x] 3.3 Wire session completion to hand off practiced cards to the manual SRS rating view (`Rate Recall`) in `src/screens/Practice.jsx`.

## 4. Verification & Testing

- [x] 4.1 Run full Vitest suite (`npm test`) to verify all new and existing tests pass cleanly.
- [x] 4.2 Validate OpenSpec change artifacts using `npx openspec validate`.
