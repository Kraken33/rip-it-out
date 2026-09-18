import { describe, it, expect } from 'vitest';
import { processReview, formatNextReview, RATINGS } from '../srs';

describe('SRS SM-2 Engine', () => {
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

  it('Rating 1 (Again) on new card sets status to learning and interval to 1 day', () => {
    const result = processReview(initialCard, 1);
    expect(result.status).toBe('learning');
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.totalReviews).toBe(1);
  });

  it('Rating 1 (Again) on reviewing card increments lapses and reduces ease factor', () => {
    const reviewingCard = { ...initialCard, status: 'reviewing', repetitions: 2, intervalDays: 6 };
    const result = processReview(reviewingCard, 1);
    expect(result.status).toBe('learning');
    expect(result.lapses).toBe(1);
    expect(result.easeFactor).toBe(2.3);
  });

  it('Rating 2 (Hard) on reviewing card scales interval conservatively and decreases ease factor', () => {
    const card = { ...initialCard, status: 'reviewing', intervalDays: 10, easeFactor: 2.5 };
    const result = processReview(card, 2);
    expect(result.easeFactor).toBe(2.35);
    expect(result.intervalDays).toBe(12);
  });

  it('Rating 3 (Good) graduates new card to learning and second Good graduates to reviewing', () => {
    const result1 = processReview(initialCard, 3);
    expect(result1.status).toBe('learning');
    expect(result1.repetitions).toBe(1);

    const result2 = processReview({ ...initialCard, status: 'learning', repetitions: 1 }, 3);
    expect(result2.status).toBe('reviewing');
    expect(result2.repetitions).toBe(2);
  });

  it('Rating 4 (Easy) increases ease factor and applies bonus interval on reviewing card', () => {
    const card = { ...initialCard, status: 'reviewing', repetitions: 2, intervalDays: 6, easeFactor: 2.5 };
    const result = processReview(card, 4);
    expect(result.easeFactor).toBe(2.65);
    expect(result.intervalDays).toBe(Math.round(6 * 2.5 * 1.3));
  });

  it('formatNextReview provides human readable relative time string', () => {
    expect(formatNextReview(new Date(Date.now() - 1000).toISOString())).toBe('Due now');
    expect(formatNextReview(new Date(Date.now() + 3600 * 1000 * 12).toISOString())).toBe('Tomorrow');
    expect(formatNextReview(new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString())).toBe('In 3 days');
  });

  it('RATINGS contains score labels and descriptions', () => {
    expect(RATINGS).toHaveLength(4);
    expect(RATINGS[0].label).toBe('Again');
    expect(RATINGS[3].label).toBe('Easy');
  });
});
