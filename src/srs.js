// ── SRS Engine: SM-2 Algorithm ─────────────────────────────────────

/**
 * Process a review rating and return updated SRS card fields.
 *
 * @param {Object} card - Current SRS card state
 * @param {number} rating - User rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 * @returns {Object} Updated card fields to merge
 */
export function processReview(card, rating) {
  const now = new Date().toISOString();
  let { easeFactor, intervalDays, repetitions, status, lapses } = card;

  if (status === 'new' || status === 'learning') {
    // ── New / Learning cards ───────────────────────────────────
    switch (rating) {
      case 1: // Again
        repetitions = 0;
        intervalDays = 1;
        status = 'learning';
        break;
      case 2: // Hard
        intervalDays = 1;
        status = 'learning';
        break;
      case 3: // Good
        if (status === 'new') {
          intervalDays = 1;
          repetitions = 1;
          status = 'learning';
        } else {
          // Graduate
          intervalDays = 1;
          repetitions = 2;
          status = 'reviewing';
        }
        break;
      case 4: // Easy
        intervalDays = 4;
        repetitions = 2;
        status = 'reviewing';
        break;
    }
  } else {
    // ── Reviewing / Mature cards ───────────────────────────────
    switch (rating) {
      case 1: // Again — lapse
        repetitions = 0;
        intervalDays = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        lapses += 1;
        status = 'learning';
        break;
      case 2: // Hard
        intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        break;
      case 3: // Good
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
        break;
      case 4: // Easy
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
        easeFactor += 0.15;
        break;
    }

    // Check mature threshold
    if (status === 'reviewing' && intervalDays > 21) {
      status = 'mature';
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetitions,
    status,
    lapses,
    nextReview: nextReview.toISOString(),
    lastReview: now,
    totalReviews: (card.totalReviews || 0) + 1,
  };
}

/**
 * Get a human-readable label for the next review time.
 */
export function formatNextReview(nextReviewISO) {
  const next = new Date(nextReviewISO);
  const now = new Date();
  const diffMs = next - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Tomorrow';
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
