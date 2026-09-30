import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  mockGetUser,
  mockMaybeSingle,
  mockSingle,
  mockSelect,
  mockEq,
  mockNeq,
  mockDelete,
  mockFrom,
  mockSupabase,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockNeq = vi.fn().mockResolvedValue({ error: null });
  const mockDelete = vi.fn().mockReturnValue({ neq: mockNeq });
  const mockFrom = vi.fn();

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  };

  return {
    mockGetUser,
    mockMaybeSingle,
    mockSingle,
    mockSelect,
    mockEq,
    mockNeq,
    mockDelete,
    mockFrom,
    mockSupabase,
  };
});

vi.mock('../supabaseClient', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: true,
}));

import {
  getSettings,
  getTopic,
  getSession,
  getImprovement,
  getSrsCard,
} from '../store';

describe('Store Layer — Supabase maybeSingle queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDelete.mockReturnValue({ neq: mockNeq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
  });

  describe('getSettings', () => {
    it('uses maybeSingle and falls back cleanly to defaults when user has no db settings row', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      });
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const settings = await getSettings();

      expect(mockFrom).toHaveBeenCalledWith('settings');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(mockSingle).not.toHaveBeenCalled();
      expect(settings.formality).toBe('casual');
      expect(settings.level).toBe('intermediate');
    });

    it('maps db settings correctly when row exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      });
      mockMaybeSingle.mockResolvedValue({
        data: {
          user_id: 'test-user-id',
          formality: 'formal',
          level: 'advanced',
          focus_area: 'grammar',
          max_improvements: 10,
          practice_mode: 'voice',
          groq_api_key: 'g-key',
          openai_model: 'gpt-4o',
          openai_api_key: 'o-key',
          tts_engine: 'browser',
          tts_voice: 'default',
          default_mode: 'seamless',
        },
        error: null,
      });

      const settings = await getSettings();

      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(settings.formality).toBe('formal');
      expect(settings.level).toBe('advanced');
      expect(settings.maxImprovements).toBe(10);
      expect(settings.openaiModel).toBe('gpt-4o');
    });
  });

  describe('entity lookups with maybeSingle', () => {
    it('getTopic uses maybeSingle and returns null when topic not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const topic = await getTopic('non-existent-topic');

      expect(mockFrom).toHaveBeenCalledWith('topics');
      expect(mockEq).toHaveBeenCalledWith('id', 'non-existent-topic');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(topic).toBeNull();
    });

    it('getSession uses maybeSingle and returns null when session not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const session = await getSession('non-existent-session');

      expect(mockFrom).toHaveBeenCalledWith('sessions');
      expect(mockEq).toHaveBeenCalledWith('id', 'non-existent-session');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(session).toBeNull();
    });

    it('getImprovement uses maybeSingle and returns null when improvement not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const imp = await getImprovement('non-existent-imp');

      expect(mockFrom).toHaveBeenCalledWith('improvements');
      expect(mockEq).toHaveBeenCalledWith('id', 'non-existent-imp');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(imp).toBeNull();
    });

    it('getSrsCard uses maybeSingle and returns null when card not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const card = await getSrsCard('non-existent-card');

      expect(mockFrom).toHaveBeenCalledWith('srs_cards');
      expect(mockEq).toHaveBeenCalledWith('improvement_id', 'non-existent-card');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(card).toBeNull();
    });
  });
});
