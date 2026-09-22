# Design

## Context

See proposal.md (Why). Current state:
- `TranslationPracticeSession.jsx` pre-computes `roundsCount = ceil(allCards.length / 4)` with `itemsPerRound = 4`, slicing `allCards` per round. With 5 fallback cards this yields a 4+1 split. `onFinish(cardsEncountered)` returns improvement records; `Practice.startRating` maps them to SRS cards for rating and logs a single `logActivity({type:'session'})` with no passage/translation content saved.
- `Practice.jsx` loads via `getPracticeCards(20,5)` + `getImprovement` into `improvements`, passes them as `allCards` to the session component.
- `store.js` sessions support `title/sourceType/tags/notes/durationSeconds/rawText/messages`; word metrics derive from `rawText`; activity stats derive from `activity_logs`. `Library.jsx` lists sessions via `getSessions()` and opens `ConversationViewerModal` for rawText sessions.
- `generateTranslationPracticePrompt` (Prompt #5) instructs 4-5 rounds × 3-5 constructions.

## Goals / Non-Goals

**Goals:**
- Persist every finished seamless practice as a first-class session artefact with per-round responses for Library/Stats visibility.
- Replace fixed batching with unlimited on-demand 2-per-round flow (Next Round / Finish Practice).
- Keep SRS recall-rating handoff and existing verdict evaluation untouched.

**Non-Goals:**
- New SRS scheduling rules; changes to verdict grading rubric; new TTS/STT behavior; Supabase schema migrations beyond existing JSON `messages`/`raw_text` columns; prompt-mode auto-saving (prompt mode stays copy/paste + manual rating).

## Decisions

- **Decision 1 — Session artefact shape (reuse `rio_sessions`, no new store key).**
  - Rationale: Library/Stats/Dashboard already aggregate `rio_sessions` + `rawText` word metrics + `activity_logs` time; reusing avoids new queries and Supabase migration.
  - Shape: `createSession({ title: 'Translation Practice — <date> — N rounds · M constructions', sourceType: 'translation-practice', tags: ['translation','russian-practice'], notes: <construction list + verdict summary>, durationSeconds, rawText: <ONLY learner translations joined by blank lines — passages and verdicts live in messages/notes and are excluded from word counts>, messages: [{role:'assistant',content:passage},{role:'user',content:translation},{role:'assistant',content:verdict summary + per-target states}] })`, then `logActivity({type:'session', durationSeconds, sessionId, topicId})`. Word metrics (`countTextWords` over `rawText`) therefore count translations only; no new metric plumbing needed.
  - Alternative considered: new `rio_translation_sessions` key — rejected (duplicates Library/Stats plumbing).
- **Decision 2 — Unlimited 2-per-round queue in `TranslationPracticeSession`.**
  - Rationale: fixes 4+1 split; matches user request exactly; keeps AI prompts short and gradable.
  - Approach: replace `itemsPerRound=4` + `roundsCount` slice with a `roundQueue` state: `rounds: [{cards:[c1,c2], passage, translation, verdict}]`. `currentRoundCards` = last queue entry's cards. `handleNextRound` appends next 2 cards (cycling least-recently-practiced when exhausted) and triggers passage generation. Header shows `Round N` + `N constructions practiced` instead of `of M`. Next/Finish buttons always visible after verdict (Next always; Finish always in header + footer).
  - Alternative considered: paging through all 20 due cards 2-at-a-time then stop — rejected (user wants unlimited).
- **Decision 3 — Queue sourcing & repeat policy.**
  - Rationale: deterministic, no repeats until exhausted, works with 5-card fallback and 20-card due lists.
  - Approach: input `improvements` order is the queue order; pointer advances 2 per round; on wrap, restart from index 0 (all have been practiced once). No shuffle (keeps SRS priority order).
- **Decision 4 — Save timing.**
  - Rationale: must not lose data on early finish; must not save empty sessions.
  - Approach: accumulate round payloads in a ref as verdicts arrive; `Practice.onFinish(roundPayload, practicedCards)` creates the session only if ≥1 submitted translation exists, then proceeds to existing `startRating` flow. `durationSeconds` from practice `startTime`.
- **Decision 5 — Prompt #5 text update.**
  - Rewrite `generateTranslationPracticePrompt` instruction lines to unlimited × 2-per-round with Next/Finish control; keep `[[phrase|target]]` tag format unchanged so parser/highlighter untouched.

## Risks / Trade-offs

- [Risk] Long unlimited sessions inflate `messages`/`rawText` size in localStorage → Mitigation: cap notes/rawText join (translations only, no verdict JSON blobs); Supabase `messages` is JSONB already.
- [Risk] `onFinish` signature change breaks existing tests/mocks → Mitigation: update `Practice.test.jsx` + `TranslationPracticeSession.test.jsx` mocks together; keep practiced-cards array as second arg for rating compat.
- [Risk] Wrapping reuses constructions users just rated poorly → Mitigation: acceptable v1; order preserved so SRS rating still covers distinct set (dedupe by improvementId for rating).

## Migration Plan

- Backward compatible: old sessions untouched; new `sourceType` value only affects display badge. No data migration. Rollback = revert code; already-saved translation sessions remain viewable as generic sessions.
