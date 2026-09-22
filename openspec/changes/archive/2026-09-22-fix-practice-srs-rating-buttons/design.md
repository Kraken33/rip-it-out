# Design

## Context

See proposal.md — Why for the full failure chain. Current state that shapes the approach:

- `src/screens/Practice.jsx` loads SRS cards once via `getPracticeCards(20, 5)` into `selectedCards`, and the matching content records via `getImprovement(card.improvementId)` into `improvements`. Both arrays are index-aligned at load time.
- `TranslationPracticeSession` receives `allCards={improvements}` (content records: `id`, `construction`, `improved`, … — no SRS fields) and calls `onFinish(cardsEncountered)` with a slice of those same improvement objects.
- `Practice.startRating(customCards)` currently does `setSelectedCards(customCards)` whenever a non-empty array arrives — replacing real SRS cards with improvement objects — and never touches `improvements`.
- The rating step renders `improvements[currentIndex]` but rates `selectedCards[currentIndex]`, so the two lists must stay index-aligned.
- `processReview(card, score)` in `src/srs.js` requires real SRS card fields (`status`, `easeFactor`, `intervalDays`, `lapses`). With `status === undefined` it takes the reviewing branch; scores 2–4 derive `intervalDays` from `undefined`, producing `NaN`, and `new Date(NaN).toISOString()` throws `RangeError`, killing the click handler. Score 1 survives on a literal interval but calls `updateSrsCard(undefined, …)`, which no-ops (`idx === -1 → null` in the localStorage path; no matching row in the Supabase path).

## Goals / Non-Goals

**Goals:**
- The Rate Recall queue always consists of genuine SRS card records keyed by `improvementId`.
- Both entry points into rating are fixed: seamless `onFinish(practicedCards)` and the prompt-based "I'm Done Practicing" button (`startRating(improvements)` — also currently passing improvement objects).
- The displayed card (`improvements[currentIndex]`) and the rated card (`selectedCards[currentIndex]`) stay aligned after filtering.

**Non-Goals:**
- Changing the SM-2 algorithm, rating labels, or the rating UI layout.
- Changing `TranslationPracticeSession`'s round/verdict logic or the `onFinish` contract shape (it still passes practiced improvement records).
- Touching `Review.jsx`, which already loads real SRS cards via `getPracticeCards` and is unaffected.

## Decisions

### 1. Reconcile practiced improvements back to the already-loaded SRS cards in `Practice.startRating`

`startRating(customCards)` treats `customCards` as **improvement records** (that is what both callers pass) and maps them to SRS cards from the `selectedCards` state loaded at mount:

- Build a set of practiced improvement ids from `customCards.map((c) => c.id ?? c.improvementId)`.
- Filter the existing `selectedCards` (SRS cards) to those whose `improvementId` is in the set, and filter `improvements` to the same practiced ids, preserving the original order — then `setSelectedCards(filteredCards)` and `setImprovements(filteredImprovements)` together so index alignment holds.
- If the filtered card list is empty, skip rating: `setStep('complete')` instead of `setStep('rating')`.

Rationale: the SRS cards are already in memory and authoritative; no extra storage round-trip, no new store API, and both call sites are fixed with one change. The `id ?? improvementId` fallback keeps `startRating` tolerant of being handed either record shape.

Alternatives considered:
- *Fetch SRS cards per practiced improvement (`getSrsCard(id)`)*: correct but adds N async store calls for data already loaded; rejected as unnecessary.
- *Change `TranslationPracticeSession` to receive and pass SRS cards*: widens the change surface into the session component and its tests; the component only needs content fields, so keeping its props unchanged is cleaner.
- *Make `processReview` defensive (default missing fields)*: masks data bugs instead of fixing the handoff; a wrong-shape card would silently schedule garbage. Rejected — but see decision 2.

### 2. Pin the `processReview` input contract with a regression test, not a code change

Add a unit test documenting that `processReview` expects an SRS card with `status`/`easeFactor`/`intervalDays`/`lapses` (e.g., a `new` card rates cleanly for all scores 1–4). The component-level regression test (finish a seamless session, click Hard/Good/Easy) is the primary guard; the unit test documents the contract that caused the failure.

### 3. Also fix the prompt-based entry point

"I'm Done Practicing → Rate Recall" calls `startRating(improvements)`. Under decision 1 this now works unchanged: improvements are mapped to their SRS cards. No separate edit needed beyond the shared `startRating` fix, but a test must cover it.

## Risks / Trade-offs

- [An SRS card is deleted between session load and finish (e.g., another tab)] → Filtering by the practiced-id set naturally excludes it; if all are gone we show the completion state rather than crashing.
- [StrictMode double-invocation or stale closures in `startRating`] → The mapping derives purely from current state and the argument; use functional `setState` or read current state inside the callback to avoid stale `selectedCards`.
- [Display/rating list misalignment if only one list is filtered] → Both lists are filtered by the same id set in the same handler, preserving order and index alignment.

## Migration Plan

Pure client-side bug fix; no data migration. Cards already corrupted by the bug are not a concern: the failing path threw before persisting, and the Again path's `updateSrsCard(undefined, …)` matched no record, so no bad data was written. Rollback is a plain revert.
