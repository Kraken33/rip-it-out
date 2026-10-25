# Proposal

## Why

Currently, Manythings frequency sentence practice progress (page number, current card index, completed, skipped, and saved counts) is stored only in browser `localStorage`. When a learner switches devices or browsers, their progress resets to Page 1, creating a disjointed multi-device experience. Furthermore, `/frequency-practice` and `/practice` (Translation Practice) use disparate UI paradigms—different top headers, divergent color palettes (indigo/slate vs. purple/gray), and non-standardized rating buttons—making the application feel fragmented rather than a cohesive practice suite.

## What Changes

- **Frequency Progress Cross-Device Sync**: Persist frequency sentence practice progress (`page_number`, `sentence_index`, `completed_count`, `skipped_count`, `saved_count`, `updated_at`) to Supabase PostgreSQL in a new `frequency_progress` table with Row-Level Security (RLS).
- **Offline-First & Optimistic Updates**: Retain instant local updates in `localStorage` for responsive flashcard navigation while performing asynchronous upserts to the database when authenticated.
- **Timestamp Conflict Resolution**: On startup or user sign-in, compare local and remote timestamps (`updated_at`) to pick the latest progress state.
- **Unified Practice Navigation Header**: Unify the top header between `/practice` and `/frequency-practice` using a shared navigation shell featuring segmented mode tabs (`[ 🌐 Translation Practice ]` and `[ ⚡ Frequency Sentences ]`) while keeping them as separate, deep-linkable routes.
- **Design Paradigm Unification**: Align `/frequency-practice` visual styling (dark purple theme, glass panels, progress bar styling, audio buttons) and standardize rating controls using the shared `RATINGS` token definitions (`1: Again`, `2: Hard`, `3: Good`, `4: Easy`).

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `frequency-sentence-practice`: Extend pagination persistence to include multi-device remote database synchronization with local fallback, and update UI requirements to mandate the shared practice navigation shell and unified practice design tokens.

## Impact

- **Database**: Adds `frequency_progress` table migration and schema in Supabase with RLS policies scoped to `auth.uid()`.
- **Store Layer**: Modifies `getFrequencyProgress()` and `saveFrequencyProgress()` in `src/store.js` to support async Supabase syncing alongside local fallback.
- **UI Components**:
  - Introduces a reusable `PracticeHeader` component used by both `Practice.jsx` and `FrequencyPracticeSession.jsx`.
  - Refactors `FrequencyPracticeSession.jsx` to adopt the shared header, the core purple design system, and unified `RATINGS` buttons.
- **Tests**: Updates unit and integration tests in `FrequencyPracticeSession.test.jsx`, `Practice.test.jsx`, `store.test.js`, and `store.supabase.test.js`.
