import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio, generateSeamlessSessionFeedback, fetchOpenAITTS } from '../services/aiService';

describe('AI Service Layer', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transcribeAudio', () => {
    it('throws error when no API key is set', async () => {
      await expect(transcribeAudio(new Blob(['test']), {})).rejects.toThrow(
        'Please configure a Groq or OpenAI API Key in Settings'
      );
    });

    it('uses Groq Whisper API when groqApiKey is set', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcribed audio content' }),
      });

      const text = await transcribeAudio(new Blob(['audio']), { groqApiKey: 'gsk_123' });
      expect(text).toBe('Transcribed audio content');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        expect.objectContaining({
          headers: { Authorization: 'Bearer gsk_123' },
        })
      );
    });
  });

  describe('generateSeamlessSessionFeedback', () => {
    it('throws error when no API key is configured', async () => {
      const session = { title: 'Tech Talk', sourceType: 'video' };
      await expect(generateSeamlessSessionFeedback(session, {}, 'I watched a video.')).rejects.toThrow(
        'No API Key configured'
      );
    });

    it('calls Groq completion endpoint and parses JSON output', async () => {
      const session = { title: 'Tech Talk', sourceType: 'video' };
      const settings = { groqApiKey: 'gsk_123' };
      const mockJsonResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                improvements: [
                  {
                    construction: 'watch [something]',
                    original: 'watched a video',
                    improved: 'went through a video presentation',
                    explanation: 'Sounds more formal',
                  },
                ],
              }),
            },
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJsonResponse,
      });

      const res = await generateSeamlessSessionFeedback(session, settings, 'I watched a video.');
      expect(res.improvements).toHaveLength(1);
      expect(res.improvements[0].construction).toBe('watch [something]');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer gsk_123' }),
        })
      );
    });
  });

  describe('fetchOpenAITTS', () => {
    it('throws error if no OpenAI key is provided', async () => {
      await expect(fetchOpenAITTS('Hello world', 'alloy', '')).rejects.toThrow('OpenAI API Key is required');
    });

    it('fetches speech blob from OpenAI API when key is provided', async () => {
      const mockBlob = new Blob(['audio data']);
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const blob = await fetchOpenAITTS('Hello world', 'nova', 'sk-testkey');
      expect(blob).toEqual(mockBlob);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/speech',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer sk-testkey' }),
          body: JSON.stringify({
            model: 'tts-1',
            input: 'Hello world',
            voice: 'nova',
          }),
        })
      );
    });
  });
});
