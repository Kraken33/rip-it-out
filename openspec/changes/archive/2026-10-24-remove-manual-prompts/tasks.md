# Tasks

## 1. Session Screen Refactoring

- [x] 1.1 Remove `ModeToggle` component and its test file (`src/components/ModeToggle.jsx`, `src/__tests__/ModeToggle.test.jsx`) and remove `ModeToggle` imports across the codebase. Verify that no references remain via `git grep ModeToggle`.
- [x] 1.2 Refactor `src/screens/Session.jsx` to eliminate prompt copy/paste steps (Prompt #1 copy, Prompt #2 export, JSON parsing, and selective import review). Configure Step 1 submission to transition directly into `SeamlessChatSession` for dialogue activity or `TranslationStorySession` for translation activity. Verify by running `npm test src/__tests__/Session.test.jsx`.

## 2. Practice Screen Refactoring

- [x] 2.1 Refactor `src/screens/Practice.jsx` to remove Prompt #3 (Scenario Q&A) and Prompt #5 (Multi-Round Translation) copy/paste interfaces. Render card-style `TranslationPracticeSession` directly for translation practice and handle exit by returning to the dashboard. Verify by running `npm test src/__tests__/Practice.test.jsx`.

## 3. Flashcard Review, Settings, and Dashboard Updates

- [x] 3.1 Update `src/screens/Review.jsx` to remove the Prompt #4 "Get Example Sentences" accordion toggle and clipboard copy button. Verify by running `npm test src/__tests__/Review.test.jsx`.
- [x] 3.2 Update `src/screens/Settings.jsx` and `src/store.js` to remove the "Default Session Interaction Mode" setting (`defaultMode`). Verify by running `npm test src/__tests__/Settings.test.jsx`.
- [x] 3.3 Update `src/screens/Dashboard.jsx` to remove the "Practice with External LLM (Prompt #3)" button and streamline prompt-related header copy to highlight interactive AI coaching. Verify by running `npm test src/__tests__/Dashboard.test.jsx`.

## 4. Prompt Generator Cleanup & Integration Verification

- [x] 4.1 Remove retired external prompt generators (`generateDescriptionPrompt`, `generateExportPrompt`, `generatePracticePrompt`, `generateTranslationPracticePrompt`, `generateExamplesPrompt`, `parseImportJSON`) from `src/prompts.js` while preserving internal AI parsers and matrix utilities (`parseExtractedConstruction`, `parseStoryFeedback`, `parseTranslationVerdict`, `VARIETY_MATRIX`). Update `src/__tests__/prompts.test.js` and verify passing tests with `npm test src/__tests__/prompts.test.js`.
- [x] 4.2 Run the full test suite (`npm test`) and frontend production build (`npm run build`) to verify zero regressions and complete removal of manual prompt interfaces.
