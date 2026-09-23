# Design

## Context

See proposal.md — Why. Key facts from root-cause analysis: the Supabase `sessions` table lacks the `activity` column that `mapSessionToDb` already sends, so every translation-session insert fails and silently falls back to localStorage while Dashboard/Library read from Supabase. `handleStoryFinish` hardcodes `durationSeconds: 0` and never calls `logActivity` (the dialogue path does both). Step 1 renders the activity picker mid-form with dialogue-only fields unconditional. `aggregateStoryConstructions(rounds, settings.maxImprovements)` slices after dedupe, so with `maxImprovements = 5` and a per-round cap of 3, rounds after round 1 are invisible. `generateStoryPassagePrompt(topic, level, formality, previousTopics)` falls back to `'everyday life'` because the only topic source is the title, which story sessions auto-generate.

## Goals / Non-Goals

**Goals:**
- Supabase inserts succeed for both activities; `activity` round-trips.
- Story finish records real duration and an activity-log entry, like the dialogue path.
- Step 1 shows only fields relevant to the chosen activity; story sessions can be steered by optional demands.
- Import list shows all deduplicated candidates from all rounds.

**Non-Goals:**
- Changing the per-round construction cap (stays at 3) or the dedupe strategy (stays normalized-text, earliest-first).
- Surfacing Supabase write failures in the UI (silent localStorage fallback behaviour is unchanged; noted as follow-up).
- Reworking the dialogue activity's Step-1 fields.
- Migrating existing localStorage-only sessions into Supabase.

## Decisions

- **Migration via `ALTER TABLE` in `supabase/schema.sql` + a `supabase/migrations/` file**: add `activity TEXT NOT NULL DEFAULT 'dialogue'` to `sessions`. The default makes existing rows read as dialogue and keeps dialogue inserts unchanged. Apply to the live DB by running the migration through the Supabase SQL editor / CLI. Alternative considered: `mapSessionToDb` drops `activity` — rejected, it hides translation sessions from activity-aware routing instead of fixing persistence.
- **Timing/logging parity in `handleStoryFinish`**: record `startedAt` when a story session starts, compute `Math.round((Date.now() - startedAt) / 1000)` at finish, and call `logActivity({ type: 'session', durationSeconds })` exactly as the dialogue path does. Keeps one code path convention instead of inventing a second stats mechanism.
- **Demands threading through the existing `topic` channel**: the optional Step-1 text is stored on the story-session object passed to `TranslationStorySession`, fed into `generateTranslationStoryPassage` → `generateStoryPassagePrompt` as the topic, and reused as the saved session's `title`/`topicId` seed when non-empty (date-based fallback otherwise). No new field on the sessions table is needed. Alternative considered: separate `demands` column — rejected as overkill; the value is only a prompt seed and a display title.
- **Aggregation: drop the slice, keep the signature optional**: `aggregateStoryConstructions(rounds, max)` keeps `max` as an optional parameter; `TranslationStorySession` stops passing it. `settings.maxImprovements` remains meaningful for the dialogue path. This keeps the helper unit-testable in isolation with and without a cap.
- **Conditional Step-1 fields by simple branching**: render `{activity === 'dialogue' ? <title/tags/notes/> : <demands/>}` rather than a config-driven field map — only two activities exist and the JSX is colocated.

## Risks / Trade-offs

- [Live DB not migrated while code ships] → apply the migration before/with deploy; until then behaviour degrades to today's silent localStorage fallback (no worse than now).
- [Removing the session-wide cap makes long sessions produce large import lists] → acceptable per product decision; the per-round cap of 3 bounds growth linearly and checkboxes control the final import.
- [Demands-as-title may create long/odd topic titles] → title is user-authored free text; acceptable, and empty demands keep the current date-based fallback.

## Migration Plan

1. Run the `activity` column migration on the live Supabase database.
2. Ship the client changes in one release; no data migration needed (`DEFAULT 'dialogue'` covers old rows).
3. Rollback: revert client release; the extra column is harmless to older clients (PostgREST ignores unknown columns on read; inserts from old clients don't reference it).
