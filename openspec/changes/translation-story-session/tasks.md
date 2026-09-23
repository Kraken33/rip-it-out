# Tasks

## 1. Prompts and AI service

- [x] 1.1 Add story passage + per-round feedback prompt builders and `parseStoryFeedback` parser in `src/prompts.js`, verified by Vitest unit tests for prompt content and parser success/error paths.
- [x] 1.2 Add `generateTranslationStoryPassage` and `evaluateTranslationStory` in `src/services/aiService.js` via shared `requestOpenAIChat`, verified by mocked-fetch Vitest tests including missing-key and empty-output errors.

## 2. Selective import on Review & Confirm

- [x] 2.1 Add checkbox selection with select-all/deselect-all and counted confirm button on Step 4 in `src/screens/Session.jsx`, verified by React Testing Library test that partial selection imports only checked items.
- [x] 2.2 Wire both `handleSeamlessFinish` and `handleImport` results through the same picker with zero-selection disabling confirm, verified by component tests for both paths.

## 3. Translation story session loop

- [x] 3.1 Create `src/screens/TranslationStorySession.jsx` with unlimited rounds (story passage, translation input incl. dictation, improved version, Next Round / Finish), verified by mocked-AI component tests for round advance and finish payload.
- [x] 3.2 Implement client-side aggregation (dedupe on normalized construction, earliest-first, cap at `settings.maxImprovements`), verified by unit tests for dedupe, ordering, and cap behavior.

## 4. Session wiring and history

- [x] 4.1 Add activity selector and Step-2 branching in `src/screens/Session.jsx` with `activity` persisted on the session record, verified by component test that dialogue vs translation render different interfaces.
- [x] 4.2 Route translation-story sessions to a story-round replay view in Library with learner-only word metrics, verified by Library/stats tests for viewer routing and word counts.
- [x] 4.3 Run `npm test` and `openspec validate --change translation-story-session --strict`, verified by clean test run and validation output.
