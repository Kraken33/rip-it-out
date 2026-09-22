# Proposal

## Why

Russian Translation Practice (seamless AI mode) currently discards everything when the session ends: passages, translations, and verdicts are held only in React state and the only persisted artefact is a single `logActivity({type:'session'})` time entry. Learners cannot review what words they practiced or how long they spent. Separately, batching 5 fallback cards at 4-per-round produces an awkward 4+1 split with a fixed pre-computed round count that blocks natural continuation.

## What Changes

- **Persist translation practice as a session artefact**: on finish, create/update a `rio_sessions` record (sourceType `translation-practice`) containing every round's passage, user translation, verdict summary, per-target outcomes, timing, and card/construction list; log `activity_logs` time entry linked to it so Stats/Dashboard show words + time. Word statistics count ONLY the learner's translations (`rawText` holds translations only); passages and verdicts are preserved in `messages`/`notes` for review but excluded from word counts.
- **Unlimited 2-per-round flow (seamless mode)**: each round generates a passage for exactly 2 constructions; after translation + verdict user can click Next Round (generates fresh round) or Finish Practice. No pre-computed `roundsCount`, no 4+1 split.
- **Construction queue sourcing**: keep `getPracticeCards(20,5)` sourcing; for seamless rounds, cycle/extend queue: use due/upcoming cards in order, and when rounds exceed available cards, reuse least-recently-practiced or reshuffle (deterministic, no repeats within a session until exhausted).
- **Prompt-based mode (Prompt #5) update**: rewrite `generateTranslationPracticePrompt` instructions from "4-5 rounds, 3-5 per round" to "unlimited rounds, 2 constructions per passage, next/finish control".
- **BREAKING**: `TranslationPracticeSession` props/round contract changes (no `roundsCount`, 2-per-round); existing tests asserting `Round 1 of 2` must be updated.

## Capabilities

### New Capabilities
- `translation-session-history`: persisting translation practice sessions (rounds, responses, verdicts, word/time metrics) as queryable session artefacts surfaced in Library/Stats.

### Modified Capabilities
- `russian-practice`: change seamless batching from fixed 4-per-round pre-computed rounds to unlimited on-demand 2-per-round flow with Next/Finish controls; update Prompt #5 text accordingly.

## Impact

- Affected code: `src/screens/TranslationPracticeSession.jsx`, `src/screens/Practice.jsx` (onFinish wiring + session save), `src/store.js` (session create/update + word metrics + activity log), `src/prompts.js` (`generateTranslationPracticePrompt`), `src/services/aiService.js` (round prompts unchanged shape, only card count changes), `src/screens/Library.jsx` / `Stats.jsx` / `Dashboard.jsx` display if needed.
- Data: new `rio_sessions` records with `sourceType:'translation-practice'` + `messages`/metadata; backward compatible (old sessions unaffected).
- Tests: `src/__tests__/TranslationPracticeSession.test.jsx`, `Practice.test.jsx`, `prompts.test.js`, `store.test.js`.
