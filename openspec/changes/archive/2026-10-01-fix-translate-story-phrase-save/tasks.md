# Tasks

## 1. Store Error Handling & Propagation

- [x] 1.1 Update `addImprovements` in `src/store.js` to log and throw errors when Supabase insertion fails instead of silently falling back to `localStorage`, and verify with unit tests in `src/__tests__/store.supabase.test.js`.

## 2. ConstructionExtractor Error Feedback & Session Validation

- [x] 2.1 Update `src/components/ConstructionExtractor.jsx` to validate `sessionId` before saving, surface explicit error messages with retry capabilities if `sessionId` is missing or `addImprovements` fails, and verify with tests in `src/__tests__/ConstructionExtractor.test.jsx`.
- [x] 2.2 Prevent premature card dismissal in `src/components/ConstructionExtractor.jsx` by isolating mouse events on extraction controls and collapsing active window selection on extract.

## 3. Translation Story Session Integration

- [x] 3.1 Verify and ensure `src/screens/TranslationStorySession.jsx` and `src/screens/Session.jsx` pass valid `sessionId` to `ConstructionExtractor` and `StoryFeedbackCard`.
- [x] 3.2 Run the full test suite (`npm test`) to verify all session extraction and library saving tests pass.
