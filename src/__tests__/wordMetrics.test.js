import { describe, it, expect, beforeEach } from 'vitest';
import {
  countTextWords,
  createSession,
  getSessions,
  getTopicWordMetrics,
  getTodayWordMetrics,
  getAllTimeWordMetrics,
  clearAllData,
} from '../store';

describe('Word Metrics Utilities', () => {
  beforeEach(() => {
    clearAllData();
  });

  describe('countTextWords', () => {
    it('returns zeroes for empty or invalid input', () => {
      expect(countTextWords('')).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
      expect(countTextWords(null)).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
      expect(countTextWords('   ')).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
    });

    it('accurately counts total and unique words and calculates density', () => {
      const text = 'I watched a video about video games and played games.';
      // words: i, watched, a, video, about, video, games, and, played, games (10 total)
      // unique: i, watched, a, video, about, games, and, played (8 unique)
      const res = countTextWords(text);
      expect(res.totalWords).toBe(10);
      expect(res.uniqueWords).toBe(8);
      expect(res.vocabularyDensity).toBe(0.8);
    });
  });

  describe('Session & Topic Aggregations', () => {
    it('aggregates word metrics for topics and daily activity', () => {
      const s1 = createSession({
        title: 'Tech News',
        sourceType: 'article',
        rawText: 'The new computer chip is fast and efficient.',
      });

      const s2 = createSession({
        title: 'Tech News',
        sourceType: 'article',
        rawText: 'Fast chips make computers better.',
      });

      const topicMetrics = getTopicWordMetrics(s1.topicId);
      expect(topicMetrics.totalWords).toBe(13);
      expect(topicMetrics.sessionCountWithText).toBe(2);

      const todayWords = getTodayWordMetrics();
      expect(todayWords).toBe(13);

      const allTime = getAllTimeWordMetrics();
      expect(allTime.totalWords).toBe(13);
      expect(allTime.sessionCountWithText).toBe(2);
    });
  });
});
