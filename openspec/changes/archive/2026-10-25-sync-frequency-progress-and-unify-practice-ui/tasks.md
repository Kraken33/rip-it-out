# Tasks

## 1. Database Schema & Migration

- [x] 1.1 Create migration SQL file `supabase/migrations/20261025000000_add_frequency_progress.sql` and update `supabase/schema.sql` with `frequency_progress` table and RLS policies. Verify file creation and SQL syntax.

## 2. Store Layer & Synchronization

- [x] 2.1 Update `getFrequencyProgress()` and `saveFrequencyProgress()` in `src/store.js` to support async Supabase syncing, optimistic `localStorage` updates, and timestamp-based conflict resolution. Verify with unit tests in `src/__tests__/store.test.js`.
- [x] 2.2 Add Supabase store tests for `frequency_progress` in `src/__tests__/store.supabase.test.js` covering remote fetch, `maybeSingle` null handling, and upsert operations. Verify test execution with `npm test -- src/__tests__/store.supabase.test.js`.

## 3. Shared Practice Navigation Shell

- [x] 3.1 Create reusable `src/components/PracticeHeader.jsx` providing the segmented mode switcher pills (`Translation Practice` / `Frequency Sentences`) and right-side contextual slot. Add tests in `src/__tests__/PracticeHeader.test.jsx`.
- [x] 3.2 Refactor `src/screens/Practice.jsx` to adopt `PracticeHeader`. Verify existing practice tests pass with `npm test -- src/__tests__/Practice.test.jsx`.

## 4. Frequency Practice Screen Refactor & Design Unification

- [x] 4.1 Refactor `src/screens/FrequencyPracticeSession.jsx` to embed `PracticeHeader`, migrate layout tokens to the standard purple/glass-panel design system, and preserve page jumper and direction controls.
- [x] 4.2 Standardize card rating buttons in `src/screens/FrequencyPracticeSession.jsx` using the shared `RATINGS` configuration from `src/srs.js` with 1–4 keyboard shortcuts.
- [x] 4.3 Update `src/__tests__/FrequencyPracticeSession.test.jsx` to verify the unified header, rating interactions, and async progress persistence. Verify with `npm test -- src/__tests__/FrequencyPracticeSession.test.jsx`.

## 5. End-to-End Verification

- [x] 5.1 Run the complete test suite with `npm test` and verify that all unit and screen tests pass with zero regressions.
