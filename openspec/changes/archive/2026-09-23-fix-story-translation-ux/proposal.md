# Proposal

## Why

The story-translation activity shipped in `translation-story-session` has four user-facing defects: the New Session form buries the activity selector mid-form and shows dialogue-only fields (title/tags/notes) for Translation sessions; there is no way to steer what stories are about; the end-of-session import list silently drops later rounds' constructions behind a hidden cap; and finished translation sessions never reach Supabase (missing `activity` column) so they vanish from Dashboard, Library, and stats.

## What Changes

- **Step-1 form rework**: move the activity selector (`Dialogue` vs `Story Translation`) to the top of Step 1, and render Title/Tags/Notes only for the Dialogue activity.
- **Story topic/demands field**: for the Translation activity, show an optional free-text "story topics / demands" input. Its value steers `generateStoryPassagePrompt` and becomes the saved session's title/topic; when empty, stories are free-topic and the title falls back to the current date-based format.
- **Show-all aggregation**: the end-of-session import list aggregates ALL candidate constructions from every round (dedupe on normalized construction, earliest first) with no `settings.maxImprovements` slice. The per-round prompt cap of 3 constructions stays; the Step-4 selective checkboxes remain the only filter before vault import.
- **Persistence fix**: add the missing `activity` column to the Supabase `sessions` schema so translation sessions actually persist to the configured backend instead of silently falling back to localStorage, and record real session timing (`durationSeconds` + activity log) on story finish so Dashboard/Stats reflect them.

## Capabilities

### New Capabilities

(none — all changes land in existing capabilities)

### Modified Capabilities

- `session-flow`: activity selector moves to the top of Step 1; Step-1 fields become activity-conditional; Translation activity gains an optional story topic/demands field.
- `translation-story-session`: end-of-session aggregation shows all deduplicated candidates with no session-wide cap; story rounds are grounded in the optional user-provided topic/demands; finished sessions persist with real measured duration and activity logging.
- `ai-seamless-integration`: story passage prompt accepts optional learner topic demands; aggregation requirement drops the `settings.maxImprovements` cap; per-round feedback cap no longer justified by a session-wide cap.
- `data-store`: session records carry the `activity` marker on both storage backends, with the Supabase `sessions` schema providing the `activity` column.

## Impact

- `src/screens/Session.jsx` (Step-1 layout/conditional fields, `handleStoryFinish` timing + logging, aggregation call without cap)
- `src/screens/TranslationStorySession.jsx` (`aggregateStoryConstructions` cap removal at call site; session prop carries topic demands)
- `src/prompts.js` (`generateStoryPassagePrompt` accepts optional topic demands)
- `src/services/aiService.js` (`generateTranslationStoryPassage` signature pass-through)
- `supabase/schema.sql` (sessions `activity` column) + migration applied to the live database
- Vitest coverage updates for Step-1 branching, aggregation-without-cap, prompt content, and finish payload timing
