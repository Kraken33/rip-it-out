# Tasks

## 1. Store and Vault Helpers

- [x] 1.1 Verify and update `src/store.js` duplicate detection and `addImprovements` helpers to safely support construction items with empty `original`; verify unit tests in `src/__tests__/store.test.js` pass.

## 2. ConstructionExtractor Component

- [x] 2.1 Implement `src/components/ConstructionExtractor.jsx` supporting selection capture within wrapped or referenced text blocks, extraction trigger button, calling `extractConstruction`, rendering preview card, handling duplicate detection, and adding to vault / SRS cards via `addImprovements`.
- [x] 2.2 Add unit and component tests in `src/__tests__/ConstructionExtractor.test.jsx` covering selection events, trigger visibility, API loading state, successful extraction rendering, duplicate reporting, saving to vault, and discard action.

## 3. Screen Integrations

- [x] 3.1 Integrate `ConstructionExtractor` into `src/screens/TranslationStorySession.jsx` for both Russian story passages and the improved version feedback block.
- [x] 3.2 Integrate `ConstructionExtractor` into `src/screens/SeamlessChatSession.jsx` for AI coach reply messages.
- [x] 3.3 Verify existing session integration tests in `src/__tests__/TranslationStorySession.test.jsx` and `src/__tests__/SeamlessChatSession.test.jsx` pass and add coverage for story passage phrase selection and extraction.

## 4. Full Suite Verification

- [x] 4.1 Run `npm test` and `npm run build` to verify all test suites and production build succeed cleanly.
- [x] 4.2 Run `openspec validate story-passage-selection-extraction --strict` to verify OpenSpec schema compliance.
