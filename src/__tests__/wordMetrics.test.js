import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  countTextWords,
  createSession,
  getTopicWordMetrics,
  getTodayWordMetrics,
  getAllTimeWordMetrics,
  clearAllData,
} from '../store';

vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('Word Metrics Utilities', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('countTextWords', () => {
    it('returns zeroes for empty or invalid input', () => {
      expect(countTextWords('')).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
      expect(countTextWords(null)).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
      expect(countTextWords('   ')).toEqual({ totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 });
    });

    it('accurately counts total and unique words and calculates density', () => {
      const text = 'I watched a video about video games and played games.';
      const res = countTextWords(text);
      expect(res.totalWords).toBe(10);
      expect(res.uniqueWords).toBe(8);
      expect(res.vocabularyDensity).toBe(0.8);
    });
  });

  describe('Session & Topic Aggregations', () => {
    it('aggregates word metrics for topics and daily activity', async () => {
      const s1 = await createSession({
        title: 'Tech News',
        sourceType: 'article',
        rawText: 'The new computer chip is fast and efficient.',
      });

      await createSession({
        title: 'Tech News',
        sourceType: 'article',
        rawText: 'Fast chips make computers better.',
      });

      const topicMetrics = await getTopicWordMetrics(s1.topicId);
      expect(topicMetrics.totalWords).toBe(13);
      expect(topicMetrics.sessionCountWithText).toBe(2);

      const todayWords = await getTodayWordMetrics();
      expect(todayWords).toBe(13);

      const allTime = await getAllTimeWordMetrics();
      expect(allTime.totalWords).toBe(13);
      expect(allTime.sessionCountWithText).toBe(2);
    });

    it('counts learner-only translation words and ignores passages/feedback', async () => {
      // Story-translation sessions persist rawText built ONLY from learner
      // translations; the passages and AI feedback live in messages and must
      // not leak into word metrics.
      await createSession({
        title: 'Story Session',
        sourceType: 'video',
        activity: 'translation',
        rawText: 'I invited a friend over and we talked.',
        messages: [
          {
            role: 'story-round',
            round: 1,
            passage: 'Вчера я пригласил друга в гости.',
            translation: 'I invited a friend over and we talked.',
            improvedVersion: 'I had a friend over and we had a good chat.',
          },
        ],
      });

      const todayWords = await getTodayWordMetrics();
      expect(todayWords).toBe(8);

      const allTime = await getAllTimeWordMetrics();
      expect(allTime.totalWords).toBe(8);
      expect(allTime.sessionCountWithText).toBe(1);
    });
  });
});
