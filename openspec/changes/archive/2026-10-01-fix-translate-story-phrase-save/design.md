# Design

## Context

See `proposal.md` for motivation.
`ConstructionExtractor` components in `TranslationStorySession.jsx` and `SeamlessChatSession.jsx` allow on-demand phrase harvesting. When saving, `ConstructionExtractor.handleSave` calls `store.addImprovements(sessionId, items)`. Currently, if `sessionId` is missing or undefined, `handleSave` returns silently. Furthermore, if Supabase is configured and returns an error upon inserting improvements, `addImprovements` in `src/store.js` fails to throw and instead falls back silently to `localStorage`, causing a split state where the UI assumes success while the cloud library remains empty.

## Goals / Non-Goals

**Goals:**
- Guarantee that `sessionId` is always available and valid whenever `ConstructionExtractor` is mounted in active story sessions.
- Provide explicit error alerts in `ConstructionExtractor` when `sessionId` is missing or when saving fails, with a retry button.
- Ensure `addImprovements` properly surfaces Supabase errors when Supabase is configured so callers can catch and display actionable feedback.

**Non-Goals:**
- Redesigning the Step 4 final import picker or changing how automatic round constructions are parsed.
- Refactoring the entire database schema.

## Decisions

1. **Explicit Error Feedback in `ConstructionExtractor.handleSave`**:
   - *Decision*: Instead of `if (!extracted || isDuplicate || isSaved || !sessionId) return;`, explicitly check `if (!sessionId)` and set `setErrorMsg('Session not initialized. Please wait or retry.')`.
   - *Rationale*: A silent return makes it impossible for users to know why clicking "+ Add to Study List" didn't persist their phrase.

2. **Propagate Supabase Write Errors in `store.addImprovements`**:
   - *Decision*: When `isSupabaseConfigured` is true, if `supabase.from('improvements').insert()` returns an error, log the error and throw an exception (or reject) so the caller can display the error banner, rather than silently falling back to `localStorage`.
   - *Rationale*: Silent fallback leads to data fragmentation where writes go to local storage while reads come from Supabase.

3. **Verify Session ID in `TranslationStorySession` and `Session.jsx`**:
   - *Decision*: Ensure `TranslationStorySession` and child components receive `sessionId={session?.id}` and disable extraction triggers if `session?.id` is not ready.

## Risks / Trade-offs

- [Risk: User offline when Supabase is configured] → Surface a clear network/database error message so the learner can retry when reconnected.
