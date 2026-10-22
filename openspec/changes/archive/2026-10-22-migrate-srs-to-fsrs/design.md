# Design

## Context
Rip It Out currently implements a hand-rolled SM-2 spaced repetition algorithm in `src/srs.js`, with state persisted across `localStorage` and Supabase PostgreSQL table `srs_cards`. See `proposal.md` for motivation.

The current system has no intraday learning steps: every card review calculates intervals in integer days (`now + 1 day` minimum). When users add or review new cards, they immediately vanish until 24 hours later. Furthermore, exact millisecond comparisons mean evening reviews aren't due the next morning or afternoon.

## Goals / Non-Goals

**Goals:**
- Integrate `ts-fsrs` (v5.4.x) to manage card state transitions, retrievability, and intervals.
- Support intraday learning steps (`enable_short_term: true`, `learning_steps: ['1m', '10m']`, `relearning_steps: ['10m']`, `request_retention: 0.9`).
- Ensure cards rated "Again" (1) or "Good" (3) during initial learning stay active today in the queue.
- Maintain full backward compatibility for existing cards without requiring manual database migration or losing learner history.
- Dual-write legacy fields (`intervalDays`, `easeFactor`, `status`, `nextReview`) so existing UI, queries, and filters continue working smoothly.

**Non-Goals:**
- Custom parameter optimization/weights tuning (FSRS default parameters provide high accuracy across millions of reviews).
- Redesigning the review screen UI layout or prompt mechanics.

## Decisions

### Decision 1: Use `ts-fsrs` package with short-term learning steps
We will configure `fsrs` from `ts-fsrs`:
```javascript
import { fsrs, Rating, State, createEmptyCard } from 'ts-fsrs';

export const scheduler = fsrs({
  request_retention: 0.9,
  enable_short_term: true,
  learning_steps: ['1m', '10m'],
  relearning_steps: ['10m'],
});
```
**Rationale**: `ts-fsrs` is zero-dependency, works in browsers and Vite bundles, and implements the proven FSRS-5 algorithm with native short-term steps.
**Alternatives considered**: Hand-coding FSRS formulas (unnecessary maintenance burden and prone to subtle math bugs).

### Decision 2: Hybrid Dual-Field Data Model & Backward Compatibility Adapter
FSRS uses `due`, `stability`, `difficulty`, `state`, `elapsed_days`, `scheduled_days`, `reps`, and `lapses`.
Legacy Rip It Out uses `nextReview`, `easeFactor`, `intervalDays`, `status`, `repetitions`, `lapses`.

We will implement an adapter `toFsrsCard(card)` and `fromFsrsCard(fsrsCard, legacyExtras)`:
```javascript
export function toFsrsCard(raw) {
  if (raw && typeof raw.stability === 'number' && typeof raw.difficulty === 'number') {
    return {
      due: new Date(raw.due || raw.nextReview),
      stability: raw.stability,
      difficulty: raw.difficulty,
      elapsed_days: raw.elapsed_days || 0,
      scheduled_days: raw.scheduled_days || raw.intervalDays || 0,
      reps: raw.reps || raw.repetitions || 0,
      lapses: raw.lapses || 0,
      state: raw.state ?? (raw.status === 'new' ? State.New : State.Review),
      last_review: raw.lastReview ? new Date(raw.lastReview) : undefined,
    };
  }

  // Gracefully upgrade legacy SM-2 card:
  const interval = raw?.intervalDays || 0;
  return {
    due: new Date(raw?.nextReview || Date.now()),
    stability: Math.max(0.1, interval),
    difficulty: Math.max(1, Math.min(10, (3.0 - (raw?.easeFactor || 2.5)) * 4 + 5)),
    elapsed_days: 0,
    scheduled_days: interval,
    reps: raw?.repetitions || 0,
    lapses: raw?.lapses || 0,
    state: raw?.status === 'new' ? State.New : State.Review,
    last_review: raw?.lastReview ? new Date(raw.lastReview) : undefined,
  };
}
```
When persisting updates:
The returned card writes both FSRS properties AND legacy properties:
`nextReview = due.toISOString()`, `intervalDays = scheduled_days`, `repetitions = reps`, `easeFactor = ...`, and `status = formatStateToStatus(state)`.
**Rationale**: Existing Supabase schema without newly added columns will continue saving without schema errors, while localStorage and expanded schemas can store full FSRS properties.

### Decision 3: Intraday In-Session & Due Queue Processing
- In `Review.jsx`, when rating is 1 (Again), the card is requeued into the session.
- In `store.js`, `calculateDueCards` compares `new Date(c.nextReview || c.due) <= now`. Cards due in 1m or 10m will naturally become due again throughout the day.
- In `saveFrequencySentenceToSrs`, cards are initialized in `State.New` without forcing an immediate +1 day review.

## Risks / Trade-offs

- **[Risk]** Existing tests expect exact SM-2 math (`easeFactor - 0.2`, `intervalDays = 1`).
  - **Mitigation**: Update `src/__tests__/srs.test.js` to assert FSRS transitions, verifying intraday intervals (`1m`, `10m`) for Again/Good and state transitions (`New` -> `Learning` -> `Review`).
- **[Risk]** Timezone/clock skew between client and Supabase server.
  - **Mitigation**: All calculations use standard UTC ISO strings (`new Date().toISOString()`), identical to current behavior.
