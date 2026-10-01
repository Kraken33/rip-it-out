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
  addImprovements,
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

  describe('addImprovements Supabase handling', () => {
    it('throws when Supabase insertion returns an error', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Foreign key violation: session does not exist' },
        }),
      });

      mockFrom.mockReturnValue({
        insert: mockInsert,
      });

      await expect(
        addImprovements('sess_invalid', [
          { construction: 'test construction', improved: 'test example' },
        ])
      ).rejects.toThrow('Foreign key violation: session does not exist');
    });

    it('successfully saves improvements and creates SRS cards on valid Supabase insert', async () => {
      const mockSelectAfterInsert = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'imp_1',
            session_id: 'sess_1',
            construction: 'test construction',
            original: '',
            improved: 'test example',
            explanation: 'exp',
            category: 'collocation',
            spoken_frequency: 'high',
            context: 'source',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelectAfterInsert,
      });

      const mockUpdateEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockUpdateEq,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'improvements') return { insert: mockInsert };
        if (table === 'srs_cards') return { insert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === 'sessions') return { update: mockUpdate };
        return {};
      });

      const res = await addImprovements('sess_1', [
        { construction: 'test construction', improved: 'test example' },
      ]);

      expect(res).toHaveLength(1);
      expect(res[0].construction).toBe('test construction');
    });
  });
});
