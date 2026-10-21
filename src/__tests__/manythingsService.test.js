import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseManythingsRawLines, fetchManythingsPage } from '../services/manythingsService';

describe('manythingsService', () => {
  describe('parseManythingsRawLines', () => {
    it('returns empty array for invalid inputs', () => {
      expect(parseManythingsRawLines(null)).toEqual([]);
      expect(parseManythingsRawLines(undefined)).toEqual([]);
      expect(parseManythingsRawLines('not-array')).toEqual([]);
    });

    it('parses tab-delimited strings correctly', () => {
      const raw = [
        '1159202\t2877272\tМарш!\tshanghainese\tGo.\tCM\t1',
        '402127\t538123\tЗдравствуйте.\todexed\tHi.\tCM\t1',
      ];

      const result = parseManythingsRawLines(raw, 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '2877272_1159202',
        enId: '2877272',
        ruId: '1159202',
        en: 'Go.',
        ru: 'Марш!',
        page: 2,
      });
      expect(result[1]).toEqual({
        id: '538123_402127',
        enId: '538123',
        ruId: '402127',
        en: 'Hi.',
        ru: 'Здравствуйте.',
        page: 2,
      });
    });

    it('deduplicates 1-to-1 so duplicate English or Russian phrases are pruned', () => {
      const raw = [
        '1159202\t2877272\tМарш!\tshanghainese\tGo.\tCM\t1',
        '5898247\t2877272\tИди.\tmarafon\tGo.\tCM\t1', // duplicate EN "Go."
        '5898250\t2877272\tИдите.\tmarafon\tGo.\tCM\t1', // duplicate EN "Go."
        '402127\t538123\tЗдравствуйте.\todexed\tHi.\tCM\t1',
        '466968\t538123\tЗдравствуйте!\tkatjka\tHello.\tCM\t1', // duplicate RU "Здравствуйте"
      ];

      const result = parseManythingsRawLines(raw, 1);
      expect(result).toHaveLength(2);
      expect(result[0].en).toBe('Go.');
      expect(result[0].ru).toBe('Марш!');
      expect(result[1].en).toBe('Hi.');
      expect(result[1].ru).toBe('Здравствуйте.');
    });

    it('ignores corrupted or incomplete lines', () => {
      const raw = [
        'corrupted line without tabs',
        '1\t2\t\tuser\tHi\tuser2', // missing RU
        '1\t2\tПривет\tuser\t\tuser2', // missing EN
        '10\t20\tСпасибо\tuser\tThanks.\tuser2\t1',
      ];

      const result = parseManythingsRawLines(raw);
      expect(result).toHaveLength(1);
      expect(result[0].en).toBe('Thanks.');
      expect(result[0].ru).toBe('Спасибо');
    });
  });

  describe('fetchManythingsPage', () => {
    let mockHead;
    let mockDoc;
    let mockWin;

    beforeEach(() => {
      mockHead = {
        appendChild: vi.fn(),
      };
      mockDoc = {
        createElement: vi.fn().mockReturnValue({
          setAttribute: vi.fn(),
          parentNode: {
            removeChild: vi.fn(),
          },
        }),
        head: mockHead,
      };
      mockWin = {};
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects on invalid page number', async () => {
      await expect(fetchManythingsPage(0)).rejects.toThrow('Invalid page number');
      await expect(fetchManythingsPage(-5)).rejects.toThrow('Invalid page number');
      await expect(fetchManythingsPage('abc')).rejects.toThrow('Invalid page number');
    });

    it('injects script tag and resolves parsed sentences on load', async () => {
      const scriptEl = {
        parentNode: { removeChild: vi.fn() },
      };
      mockDoc.createElement.mockReturnValue(scriptEl);

      const promise = fetchManythingsPage(1, {
        documentRef: mockDoc,
        windowRef: mockWin,
      });

      expect(mockHead.appendChild).toHaveBeenCalledWith(scriptEl);
      expect(scriptEl.src).toBe('https://www.manythings.org/bilingual/rus/1.js');

      // Simulate payload arrival and onload
      mockWin.sent = [
        '10\t20\tПривет\tauthor1\tHi.\tauthor2\t1',
      ];
      scriptEl.onload();

      const result = await promise;
      expect(result).toHaveLength(1);
      expect(result[0].en).toBe('Hi.');
      expect(result[0].ru).toBe('Привет');
      expect(scriptEl.parentNode.removeChild).toHaveBeenCalled();
      expect(mockWin.sent).toBeUndefined();
    });

    it('rejects when onload fires but window.sent is invalid', async () => {
      const scriptEl = {
        parentNode: { removeChild: vi.fn() },
      };
      mockDoc.createElement.mockReturnValue(scriptEl);

      const promise = fetchManythingsPage(1, {
        documentRef: mockDoc,
        windowRef: mockWin,
      });

      mockWin.sent = null;
      scriptEl.onload();

      await expect(promise).rejects.toThrow('Failed to load sentences: page 1 payload was empty or invalid.');
    });

    it('rejects on script onerror network failure', async () => {
      const scriptEl = {
        parentNode: { removeChild: vi.fn() },
      };
      mockDoc.createElement.mockReturnValue(scriptEl);

      const promise = fetchManythingsPage(2, {
        documentRef: mockDoc,
        windowRef: mockWin,
      });

      scriptEl.onerror();

      await expect(promise).rejects.toThrow('Network error: could not load Manythings page 2');
    });

    it('rejects on timeout if script never completes', async () => {
      vi.useFakeTimers();
      const scriptEl = {
        parentNode: { removeChild: vi.fn() },
      };
      mockDoc.createElement.mockReturnValue(scriptEl);

      const promise = fetchManythingsPage(3, {
        timeoutMs: 1000,
        documentRef: mockDoc,
        windowRef: mockWin,
      });

      vi.advanceTimersByTime(1100);

      await expect(promise).rejects.toThrow('Timeout: loading Manythings page 3 took longer than 1000ms.');
      vi.useRealTimers();
    });
  });
});
