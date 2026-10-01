# Proposal

## Why

When learners select a phrase to extract and save to their vault during a Translate Story session, the phrase appears to save in the UI preview card ("✓ Added to Study List!"), but never reaches Supabase or appears in the Phrase Library. This is caused by missing/unhandled `sessionId` availability or silent fallback to local storage when Supabase write errors occur, preventing harvested phrases from persisting to the learner's cloud vault.

## What Changes

- Ensure `ConstructionExtractor` and `TranslationStorySession` reliably receive and validate active `sessionId` before initiating phrase extractions.
- Update `ConstructionExtractor.handleSave` to provide explicit error feedback rather than silently aborting when `sessionId` is missing or when `addImprovements` fails.
- Fix `addImprovements` in `src/store.js` to surface Supabase insertion errors rather than silently falling back to `localStorage` when Supabase is configured.
- Ensure harvested constructions saved mid-session properly reflect in the Library and SRS practice queues.

## Capabilities

### Modified Capabilities
- `construction-harvesting`: Ensure harvested constructions reliably persist to the active data store (Supabase or LocalStorage) with robust session identification and explicit error handling on failure.

## Impact

- `src/components/ConstructionExtractor.jsx`: Save handler, error states, and session ID validation.
- `src/screens/TranslationStorySession.jsx`: Proper passing and reactivity of `session.id` to extractor components.
- `src/store.js`: `addImprovements` error propagation when Supabase writes fail.
