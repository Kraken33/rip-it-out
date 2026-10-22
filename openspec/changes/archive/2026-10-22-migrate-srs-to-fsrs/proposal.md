# Proposal

## Why
The current SM-2 flashcard scheduling implementation calculates intervals in whole days (`intervalDays >= 1`) with no intraday learning steps. Consequently, newly added or reviewed cards immediately disappear for 24+ hours even when forgotten or rated "Again" or "Hard", leaving learners with zero cards due for the rest of the day.

Migrating to `ts-fsrs` (the modern Free Spaced Repetition Scheduler algorithm adopted by Anki 23.10+) introduces intraday learning steps (`1m`, `10m`), scientific memory retrievability modeling based on stability and difficulty, and proper handling of new, learning, and lapsed cards while preserving existing card progress.

## What Changes
- Install `ts-fsrs` as a production dependency.
- Replace the legacy SM-2 implementation in `src/srs.js` with an FSRS-powered scheduler supporting short-term learning steps (`enable_short_term: true`, `learning_steps: ['1m', '10m']`, `relearning_steps: ['10m']`, `request_retention: 0.9`).
- Update card state representations to support FSRS properties (`due`, `stability`, `difficulty`, `state`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`) alongside backward-compatible fallbacks for legacy cards.
- Update `calculateDueCards`, `getDueCards`, and `getPracticeCards` in `src/store.js` to recognize intraday due cards based on FSRS `due` timestamps.
- Ensure newly saved cards (including from Frequency Sentence Practice and Construction Harvesting) remain accessible and properly staged in `State.New` or initial learning steps without being locked out for 24 hours.
- Update unit tests in `src/__tests__/srs.test.js`, `store.test.js`, and screen tests to validate FSRS transitions.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `srs-engine`: Replaces the SM-2 calculation engine with FSRS (Free Spaced Repetition Scheduler), adding short-term intraday steps for New/Learning/Relearning states and mapping stability and difficulty metrics.
- `flashcard-review`: Updates due card retrieval and review rating actions to handle intraday due cards and FSRS states.

## Impact
- **Dependencies**: Adds `ts-fsrs` (zero-dependency, lightweight, MIT).
- **Core Files**: `src/srs.js`, `src/store.js`, `src/screens/Review.jsx`, `src/screens/Practice.jsx`, `src/screens/Library.jsx`.
- **Database / Storage**: Card records in Supabase `srs_cards` and `localStorage` gain FSRS fields (`stability`, `difficulty`, `state`, `due`) with transparent fallback mapping for existing rows.
- **Tests**: `src/__tests__/srs.test.js` and dependent review/practice tests updated to verify FSRS transitions.
