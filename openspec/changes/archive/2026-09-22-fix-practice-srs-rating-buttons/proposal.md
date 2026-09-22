# Proposal

## Why

After a translation practice session (Seamless AI or Prompt #5), the user is taken to the "Rate Recall" SRS evaluation step, but only the **Again** button responds — Hard, Good, and Easy clicks do nothing, so practiced cards cannot be evaluated for SRS. Worse, even the working Again rating is silently discarded and never persisted.

Root cause: `TranslationPracticeSession` hands **improvement objects** (not SRS cards) to `Practice.startRating`, which overwrites the real SRS cards in `selectedCards`. `handleRate` then runs `processReview` on records missing `status`, `easeFactor`, `intervalDays`, `lapses`, and `improvementId`. With `status` undefined the SM-2 "reviewing" branch runs: ratings 2–4 compute `intervalDays` from `undefined` → `NaN` → `new Date(NaN).toISOString()` throws a `RangeError`, so the click handler dies before advancing. Rating 1 survives only because its interval is a literal `1` — but its `updateSrsCard(undefined, …)` persists nothing. The prompt-based "I'm Done Practicing → Rate Recall" path passes `improvements` the same way and is equally broken.

## What Changes

- Map the practiced improvements handed back from a translation practice session (or the prompt-based flow) to their corresponding **SRS card records** before entering the Rate Recall step, so `processReview` and `updateSrsCard` always operate on real SRS cards keyed by `improvementId`.
- Practiced improvements without a matching SRS card MUST be excluded from the rating queue; if none remain, skip straight to the completion state.
- All four rating buttons (Again, Hard, Good, Easy) MUST advance the queue and persist the updated SRS schedule for every practiced card.
- Add regression coverage: component test that finishes a seamless translation session and successfully rates with Hard/Good/Easy, plus a unit test pinning `processReview`'s contract that it requires a real SRS card.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `russian-practice`: Strengthen the "Transition to Manual SRS Recall Rating" requirement — the rating interface MUST receive the SRS card records of the practiced constructions (matched by improvement id), every rating score 1–4 MUST be applicable and persisted, and practiced items without an SRS card are skipped.

## Impact

- **Code**: `src/screens/Practice.jsx` (map practiced improvements → SRS cards in `startRating`; keep rating display list in sync); possibly `src/screens/TranslationPracticeSession.jsx` (handoff payload shape — improvement ids vs objects).
- **Tests**: `src/__tests__/Practice.test.jsx`, possibly `src/__tests__/TranslationPracticeSession.test.jsx`, `src/__tests__/srs.test.js`.
- **Specs**: `openspec/specs/russian-practice/spec.md` (delta).
- No dependency, schema, or API changes. No changes to the SM-2 algorithm itself.
