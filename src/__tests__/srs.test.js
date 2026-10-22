import { describe, it, expect } from 'vitest';
import {
  processReview,
  formatNextReview,
  RATINGS,
  scheduler,
  toFsrsCard,
  fsrsStateToStatus,
  statusToFsrsState,
  State,
} from '../srs';

describe('SRS Engine (FSRS Integration)', () => {
  const initialCard = {
    improvementId: 'imp1',
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    totalReviews: 0,
    lapses: 0,
    nextReview: new Date().toISOString(),
  };

  it('Rating 1 (Again) on new card sets status to learning and schedules immediate intraday step (1 min)', () => {
    const before = Date.now();
    const result = processReview(initialCard, 1);
    const scheduledDue = new Date(result.nextReview).getTime();

    expect(result.status).toBe('learning');
    expect(result.state).toBe(State.Learning);
    expect(result.repetitions).toBe(1);
    expect(result.totalReviews).toBe(1);
    // 1-minute learning step: due should be ~60s in future, NOT 1 full day
    const diffSec = Math.round((scheduledDue - before) / 1000);
    expect(diffSec).toBeGreaterThanOrEqual(55);
    expect(diffSec).toBeLessThanOrEqual(65);
  });

  it('Rating 1 (Again) on reviewing card lapses card into relearning step with lapse count incremented', () => {
    const reviewingCard = {
      ...initialCard,
      status: 'reviewing',
      state: State.Review,
      stability: 10,
      difficulty: 5,
      repetitions: 3,
      intervalDays: 10,
    };
    const before = Date.now();
    const result = processReview(reviewingCard, 1);
    expect(result.status).toBe('learning');
    expect(result.state).toBe(State.Relearning);
    expect(result.lapses).toBe(1);
    const diffSec = Math.round((new Date(result.nextReview).getTime() - before) / 1000);
    // 10-minute relearning step
    expect(diffSec).toBeGreaterThanOrEqual(550);
    expect(diffSec).toBeLessThanOrEqual(650);
  });

  it('Rating 2 (Hard) updates card difficulty and keeps conservative interval', () => {
    const reviewingCard = {
      ...initialCard,
      status: 'reviewing',
      state: State.Review,
      stability: 5,
      difficulty: 5,
      repetitions: 2,
    };
    const result = processReview(reviewingCard, 2);
    expect(result.difficulty).toBeGreaterThanOrEqual(5);
    expect(result.totalReviews).toBe(1);
    expect(Number.isFinite(result.stability)).toBe(true);
  });

  it('Rating 3 (Good) on new card sets 10-minute learning step and graduates on next Good', () => {
    const before = Date.now();
    const step1 = processReview(initialCard, 3);
    expect(step1.status).toBe('learning');
    expect(step1.state).toBe(State.Learning);
    const diffSec = Math.round((new Date(step1.nextReview).getTime() - before) / 1000);
    expect(diffSec).toBeGreaterThanOrEqual(550);
    expect(diffSec).toBeLessThanOrEqual(650);

    const step2 = processReview(step1, 3);
    expect(step2.status).toBe('reviewing');
    expect(step2.state).toBe(State.Review);
    expect(step2.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('Rating 4 (Easy) immediately graduates new card into reviewing state with accelerated stability', () => {
    const result = processReview(initialCard, 4);
    expect(result.status).toBe('reviewing');
    expect(result.state).toBe(State.Review);
    expect(result.intervalDays).toBeGreaterThanOrEqual(4);
  });

  it('toFsrsCard transparently adapts legacy cards without error', () => {
    const legacy = {
      improvementId: 'legacy_1',
      status: 'reviewing',
      easeFactor: 2.1,
      intervalDays: 7,
      repetitions: 4,
      lapses: 1,
      nextReview: new Date().toISOString(),
    };
    const fsrsCard = toFsrsCard(legacy);
    expect(fsrsCard.state).toBe(State.Review);
    expect(fsrsCard.stability).toBe(7);
    expect(fsrsCard.difficulty).toBeGreaterThan(1);
    expect(fsrsCard.reps).toBe(4);
    expect(fsrsCard.lapses).toBe(1);
  });

  it('formatNextReview provides human-readable relative time strings including intraday minutes and hours', () => {
    expect(formatNextReview(new Date(Date.now() - 1000).toISOString())).toBe('Due now');
    expect(formatNextReview(new Date(Date.now() + 60 * 1000).toISOString())).toBe('In 1 min');
    expect(formatNextReview(new Date(Date.now() + 10 * 60 * 1000).toISOString())).toBe('In 10 mins');
    expect(formatNextReview(new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString())).toBe('In 3 days');
  });

  it('RATINGS contains score labels and descriptions', () => {
    expect(RATINGS).toHaveLength(4);
    expect(RATINGS[0].label).toBe('Again');
    expect(RATINGS[3].label).toBe('Easy');
  });

  it('processReview contract: a complete new-status SRS card rates cleanly for all scores 1-4', () => {
    for (const score of [1, 2, 3, 4]) {
      const result = processReview({ ...initialCard }, score);
      expect(Number.isFinite(result.intervalDays)).toBe(true);
      expect(Number.isFinite(result.easeFactor)).toBe(true);
      expect(Number.isNaN(new Date(result.nextReview).getTime())).toBe(false);
      expect(Number.isNaN(new Date(result.due).getTime())).toBe(false);
      expect(typeof result.state).toBe('number');
    }
  });
});
