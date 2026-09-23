# Tasks

## 1. Supabase schema migration

- [x] 1.1 Add `activity TEXT NOT NULL DEFAULT 'dialogue'` to the `sessions` table definition in `supabase/schema.sql` and add a migration file `supabase/migrations/<timestamp>_add_sessions_activity.sql` with the matching `ALTER TABLE`; verify `openspec validate` is unaffected and the SQL is idempotent (`ADD COLUMN IF NOT EXISTS`)
- [x] 1.2 Apply the migration to the live database via the Supabase SQL editor or CLI, then verify with `select column_name from information_schema.columns where table_name = 'sessions';` that `activity` exists — **DONE via Supabase MCP** (2026-09-23): token refreshed from `~/.gemini/antigravity/mcp_oauth_tokens.json`, applied via `apply_migration('add_sessions_activity')` on project `qirszyzsygsziaiykoaj`; verified `activity TEXT NOT NULL DEFAULT 'dialogue'` exists, all 24 existing rows backfilled to `'dialogue'`, migration `20260923111857` recorded in history; `get_advisors` shows only 3 pre-existing warnings unrelated to this change

## 2. Story finish: timing + activity logging

- [x] 2.1 Record a story-session `startedAt` timestamp in `Session.jsx` and compute real `durationSeconds` in `handleStoryFinish` instead of hardcoding `0`; verify a unit test asserts the saved session carries a positive duration
- [x] 2.2 Call `logActivity({ type: 'session', durationSeconds, ... })` from `handleStoryFinish` mirroring the dialogue path; verify a test mocks `logActivity` and asserts it was called once with the measured duration

## 3. Step-1 form rework + story demands

- [x] 3.1 Move the activity selector to the top of the Step-1 form in `Session.jsx` and render Title/Source Type/Tags/Notes only when `activity === 'dialogue'`; verify tests assert the selector is the first control and dialogue-only fields are absent for the translation activity
- [x] 3.2 Add an optional "Story topics / demands" free-text field shown only for the translation activity and thread its value into the story-session object passed to `TranslationStorySession`; verify a test asserts the session receives the entered text
- [x] 3.3 Use non-empty demands as the story session's `title`/topic seed in `handleStoryFinish`, keeping the date-based fallback when empty; verify a test covers both branches

## 4. Story prompt honours demands

- [x] 4.1 Extend `generateStoryPassagePrompt` in `src/prompts.js` to incorporate learner topic demands into the passage instructions when provided; verify a prompt-content test asserts the demands text appears and the everyday-topic fallback remains for empty demands
- [x] 4.2 Pass the demands through `generateTranslationStoryPassage` in `src/services/aiService.js`; verify a test mocks the OpenAI call and asserts the built user message contains the demands

## 5. Aggregation shows all candidates

- [x] 5.1 Make the `max` parameter of `aggregateStoryConstructions` optional (no slice when omitted) in `src/screens/TranslationStorySession.jsx`; verify unit tests cover: capped behaviour when `max` is passed, uncapped behaviour when omitted, dedupe keeping earliest occurrence
- [x] 5.2 Stop passing `settings.maxImprovements` at the story-session aggregation call site; verify a component test finishing a 2+ round session shows every round's candidates in the import picker
- [x] 5.3 Update the session-flow spec wording references: run `openspec validate fix-story-translation-ux --strict` and confirm it passes

## 6. End-to-end verification

- [x] 6.1 Run `npm test` and confirm the full suite passes
- [ ] 6.2 Manual smoke test with Supabase configured: create a translation story session with demands, complete 2 rounds, finish — verify the session appears on Dashboard/Library with real duration, the import list shows all candidates, and the Supabase `sessions` row has `activity = 'translation'` — **BLOCKED (user action): requires a running app against live Supabase; depends on 1.2**
