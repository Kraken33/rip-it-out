# Design

## Context

See `proposal.md` for background and motivation. Frequency sentence progress is currently tracked in `rio_frequency_progress` in localStorage, while user settings, SRS cards, and sessions sync with Supabase PostgreSQL via RLS policies. The practice routes (`/practice` and `/frequency-practice`) live in the same app but have developed divergent styles and separate navigation headers.

## Goals / Non-Goals

**Goals:**
- Provide reliable cross-device persistence for Manythings frequency sentence practice via a dedicated Supabase `frequency_progress` table.
- Guarantee snappy offline-first user experience: card ratings and flips update local storage immediately and trigger background sync.
- Unify practice mode navigation with a shared `PracticeHeader` component used by both `/practice` and `/frequency-practice`.
- Align `/frequency-practice` styling, card framing, and rating actions with the core purple theme and `RATINGS` specifications used throughout the app.

**Non-Goals:**
- Merging the two routes into a single URL (they remain distinct `/practice` and `/frequency-practice` routes to preserve direct linking and bookmarks).
- Modifying Tatoeba / Manythings fetching logic or sentence pagination chunk size.
- Realtime multi-client live cursors (this is asynchronous cross-device state resumption, not real-time collaborative editing).

## Decisions

### 1. Database Schema for Frequency Progress
Create a dedicated `public.frequency_progress` table with `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`:
```sql
CREATE TABLE IF NOT EXISTS public.frequency_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INT NOT NULL DEFAULT 1,
  sentence_index INT NOT NULL DEFAULT 0,
  completed_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  saved_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.frequency_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frequency_progress_owner_access" ON public.frequency_progress
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```
*Rationale*: A dedicated 1:1 user table is cleanly scoped, easy to query using `.maybeSingle()`, and matches the existing pattern for `public.settings`.
*Alternative considered*: Storing frequency progress inside `settings` JSON. Rejected because frequency progress updates frequently during practice (after every card flip/rating) and should not cause lock or rewrite contention on user preferences.

### 2. Synchronization & Conflict Resolution Strategy
- **Local Optimistic Cache**: Every rating action writes immediately to `localStorage` key `rio_frequency_progress` with `lastUpdated: new Date().toISOString()`, preventing any network lag during rapid card flips.
- **Background Upsert**: If Supabase is configured and a user is authenticated, an async `upsert` sends the progress update to `frequency_progress`.
- **Startup Sync**: On session load, `getFrequencyProgress()` reads local storage and optionally queries Supabase. If remote `updated_at` is newer than local `lastUpdated`, the remote progress is adopted and mirrored to local storage; otherwise the local progress is preserved and upserted.
*Alternative considered*: Incremental event log for every card swipe. Rejected as unnecessary complexity since pagination index and counters represent the complete aggregate state.

### 3. Shared Practice Shell Component (`PracticeHeader`)
Extract a reusable navigation header component `src/components/PracticeHeader.jsx`:
- Displays top mode switcher pills:
  - `🌐 Translation Practice` (links to `/practice`)
  - `⚡ Frequency Sentences` (links to `/frequency-practice`)
- Accepts a `rightContent` slot for contextual controls:
  - On `/practice`: empty or session finish action
  - On `/frequency-practice`: Page jumper dropdown button (`Page {currentPage} ▾`), direction toggle (`🇷🇺 RU → 🇬🇧 EN`), and done count summary.
*Rationale*: Ensures visual and layout parity while cleanly separating route-specific contextual tools.

### 4. Design System & Rating Token Alignment
- Refactor `FrequencyPracticeSession.jsx` to replace the one-off `indigo`/`slate` styling with standard app tokens:
  - Container: `max-w-2xl mx-auto space-y-6 animate-fade-in py-2`
  - Cards: `glass-panel p-6 sm:p-8 rounded-2xl border border-gray-800`
  - Accent colors: `purple-600`, `purple-500`, `purple-400`, `bg-purple-950/20`, `border-purple-500/30`
- Replace hardcoded rating buttons in `FrequencyPracticeSession` with standard `RATINGS` mapping from `src/srs.js`, rendering:
  - 1: Again (rose)
  - 2: Hard (amber)
  - 3: Good (emerald)
  - 4: Easy (blue/emerald)
  Along with numeric shortcut badges (1–4).

## Risks / Trade-offs

- **[Risk] Rapid Card Flipping Causing Excess Supabase Requests**: Rating multiple sentences in rapid succession could trigger back-to-back upsert HTTP calls.
  - *Mitigation*: Debounce the remote upsert (e.g. 500ms trailing) or queue updates, while keeping `localStorage` synchronous and instantaneous.
- **[Risk] Stale Progress on Device Switch**: User leaves a browser tab open on Device A, studies on Device B, and resumes Device A.
  - *Mitigation*: Re-fetch frequency progress on window focus or practice component mount.
- **[Risk] Backward Compatibility**: Existing users have local progress stored as `page` instead of `pageNumber`.
  - *Mitigation*: Store mappers handle both `page` and `pageNumber` interchangeably.
