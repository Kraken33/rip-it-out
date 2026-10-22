// ── SRS Engine: FSRS (Free Spaced Repetition Scheduler) ─────────────
import { fsrs, Rating, State, createEmptyCard } from 'ts-fsrs';

export const scheduler = fsrs({
  request_retention: 0.9,
  enable_short_term: true,
  learning_steps: ['1m', '10m'],
  relearning_steps: ['10m'],
});

export { Rating, State, createEmptyCard };

/**
 * Map FSRS numerical state to human-readable legacy status string.
 */
export function fsrsStateToStatus(state, stability = 0) {
  switch (state) {
    case State.New:
      return 'new';
    case State.Learning:
    case State.Relearning:
      return 'learning';
    case State.Review:
      return stability > 21 ? 'mature' : 'reviewing';
    default:
      return 'learning';
  }
}

/**
 * Map legacy status string to FSRS numerical state.
 */
export function statusToFsrsState(status) {
  switch (status) {
    case 'new':
      return State.New;
    case 'learning':
      return State.Learning;
    case 'reviewing':
    case 'mature':
      return State.Review;
    default:
      return State.Learning;
  }
}

/**
 * Normalize an arbitrary card state into a valid FSRS card object.
 */
export function toFsrsCard(raw) {
  if (raw && typeof raw.stability === 'number' && typeof raw.difficulty === 'number' && typeof raw.state === 'number') {
    return {
      due: raw.due ? new Date(raw.due) : new Date(raw.nextReview || Date.now()),
      stability: raw.stability,
      difficulty: raw.difficulty,
      elapsed_days: raw.elapsed_days ?? 0,
      scheduled_days: raw.scheduled_days ?? raw.intervalDays ?? 0,
      reps: raw.reps ?? raw.repetitions ?? raw.totalReviews ?? 0,
      lapses: raw.lapses ?? 0,
      learning_steps: raw.learning_steps ?? 0,
      state: raw.state,
      last_review: raw.last_review ? new Date(raw.last_review) : raw.lastReview ? new Date(raw.lastReview) : undefined,
    };
  }

  // Gracefully adapt legacy card
  const interval = raw?.intervalDays || 0;
  const legacyStatus = raw?.status || 'new';
  const state = statusToFsrsState(legacyStatus);

  const ease = raw?.easeFactor || 2.5;
  const difficulty = Math.max(1, Math.min(10, Math.round(((3.0 - ease) * 4 + 5) * 10) / 10));
  const stability = Math.max(0.1, interval);

  return {
    due: new Date(raw?.nextReview || raw?.due || Date.now()),
    stability: state === State.New ? 0 : stability,
    difficulty: state === State.New ? 0 : difficulty,
    elapsed_days: 0,
    scheduled_days: interval,
    reps: raw?.repetitions ?? raw?.totalReviews ?? 0,
    lapses: raw?.lapses ?? 0,
    learning_steps: raw?.learning_steps ?? 0,
    state,
    last_review: raw?.lastReview ? new Date(raw.lastReview) : undefined,
  };
}

/**
 * Process a review rating and return updated SRS card fields.
 *
 * @param {Object} card - Current SRS card state
 * @param {number} rating - User rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 * @returns {Object} Updated card fields to merge
 */
export function processReview(card, rating) {
  const now = new Date();
  const fsrsCard = toFsrsCard(card);
  const result = scheduler.next(fsrsCard, now, rating);
  const updated = result.card;

  const status = fsrsStateToStatus(updated.state, updated.stability);
  const easeFactor = card?.easeFactor
    ? Math.round(Math.max(1.3, 3.0 - (updated.difficulty - 5) / 4) * 100) / 100
    : 2.5;

  return {
    // Legacy properties for backward compatibility
    easeFactor,
    intervalDays: updated.scheduled_days,
    repetitions: updated.reps,
    status,
    lapses: updated.lapses,
    nextReview: updated.due.toISOString(),
    lastReview: now.toISOString(),
    totalReviews: (card?.totalReviews || 0) + 1,

    // Modern FSRS properties
    due: updated.due.toISOString(),
    stability: Math.round(updated.stability * 100) / 100,
    difficulty: Math.round(updated.difficulty * 100) / 100,
    state: updated.state,
    learning_steps: updated.learning_steps,
    elapsed_days: updated.elapsed_days,
    scheduled_days: updated.scheduled_days,
    reps: updated.reps,
    last_review: now.toISOString(),
  };
}

/**
 * Get a human-readable label for the next review time.
 */
export function formatNextReview(nextReviewISO) {
  if (!nextReviewISO) return 'Due now';
  const next = new Date(nextReviewISO);
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();

  if (diffMs <= 0) return 'Due now';

  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 60) return diffMin <= 1 ? 'In 1 min' : `In ${diffMin} mins`;
  if (diffHours < 24 && next.getDate() === now.getDate()) return `In ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  if (diffDays <= 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
  return `In ${Math.round(diffDays / 30)} months`;
}

/**
 * Rating labels with descriptions.
 */
export const RATINGS = [
  { score: 1, label: 'Again', description: "I completely forgot", color: 'var(--danger)' },
  { score: 2, label: 'Hard', description: "Struggled to remember", color: 'var(--warning)' },
  { score: 3, label: 'Good', description: "Remembered with effort", color: 'var(--success)' },
  { score: 4, label: 'Easy', description: "Knew it instantly", color: 'var(--accent)' },
];
