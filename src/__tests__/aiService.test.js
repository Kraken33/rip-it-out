import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio, generateSeamlessSessionFeedback, streamSeamlessChatCompletion, fetchOpenAITTS, generateTranslationRoundPassage, evaluateTranslationRound, OPENAI_MODEL_OPTIONS } from '../services/aiService';

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

    it('falls back to OpenAI Whisper API when only openaiApiKey is set', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcribed via OpenAI' }),
      });

      const text = await transcribeAudio(new Blob(['audio']), { openaiApiKey: 'sk_123' });
      expect(text).toBe('Transcribed via OpenAI');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/transcriptions',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk_123' },
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

    it('rejects when only a Groq API key is configured', async () => {
      const session = { title: 'Tech Talk', sourceType: 'video' };
      await expect(
        generateSeamlessSessionFeedback(session, { groqApiKey: 'gsk_123' }, 'I watched a video.')
      ).rejects.toThrow('OpenAI API Key');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls the OpenAI chat endpoint and parses JSON output', async () => {
      const session = { title: 'Tech Talk', sourceType: 'video' };
      const settings = { openaiApiKey: 'sk_123' };
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
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer sk_123' }),
        })
      );
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.temperature).toBe(0.3);
      expect(body.max_tokens).toBe(8000);
    });

    it('uses the configured openaiModel even when a Groq key is also set', async () => {
      const session = { title: 'Tech Talk', sourceType: 'video' };
      const settings = { openaiApiKey: 'sk_123', groqApiKey: 'gsk_123', openaiModel: 'gpt-4o' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
        }),
      });

      await generateSeamlessSessionFeedback(session, settings, 'I watched a video.');

      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer sk_123');
      expect(JSON.parse(options.body).model).toBe('gpt-4o');
    });
  });

  describe('streamSeamlessChatCompletion', () => {
    it('rejects when only a Groq API key is configured', async () => {
      await expect(
        streamSeamlessChatCompletion({}, [], { groqApiKey: 'gsk_123' })
      ).rejects.toThrow('OpenAI API Key');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('posts to the OpenAI chat endpoint with the configured model', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hello! That sounds fascinating.' } }] }),
      });

      const chunks = [];
      const reply = await streamSeamlessChatCompletion(
        { title: 'Atomic Habits', sourceType: 'book' },
        [{ role: 'user', content: 'Hi' }],
        { openaiApiKey: 'sk_123', openaiModel: 'gpt-4o' },
        (chunk) => chunks.push(chunk)
      );

      expect(reply).toBe('Hello! That sounds fascinating.');
      expect(chunks).toEqual(['Hello! That sounds fascinating.']);

      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer sk_123');
      expect(JSON.parse(options.body).model).toBe('gpt-4o');
    });
  });

  describe('generateTranslationRoundPassage', () => {
    it('throws error when no API key is set', async () => {
      await expect(generateTranslationRoundPassage([], {})).rejects.toThrow('No API Key configured');
    });

    it('requests a tagged Russian passage for the round at writing temperature', async () => {
      const roundCards = [
        { construction: 'invite over', improved: 'I invited him over' },
        { construction: 'catch up', improved: 'We should catch up' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Вчера я [[пригласил друга в гости|invite over]], и мы [[поболтали|catch up]].',
              },
            },
          ],
        }),
      });

      const reply = await generateTranslationRoundPassage(roundCards, { openaiApiKey: 'sk-test123' });

      expect(reply).toContain('пригласил друга в гости');

      const [url, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(body.temperature).toBe(0.7);
      expect(body.messages[0].content).toContain('[[Russian phrase|Target English Construction]]');
      expect(body.messages[0].content).toContain('invite over');
      expect(body.messages[0].content).toContain('catch up');
      expect(body.messages[0].content).not.toContain('NEVER invent changes');
    });

    it('rejects when the model returns an empty passage', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '' } }] }),
      });

      await expect(
        generateTranslationRoundPassage([{ construction: 'invite over' }], { openaiApiKey: 'sk_1' })
      ).rejects.toThrow('ran out of tokens');
    });

    it('rejects when only a Groq API key is set', async () => {
      await expect(
        generateTranslationRoundPassage([{ construction: 'invite over' }], { groqApiKey: 'gsk_1' })
      ).rejects.toThrow('OpenAI API Key');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('evaluateTranslationRound', () => {
    const roundCards = [{ construction: 'invite over', improved: 'I invited him over' }];
    const settings = { openaiApiKey: 'sk_123' };

    it('throws error when no API key is set', async () => {
      await expect(evaluateTranslationRound([], 'passage', 'translation', {})).rejects.toThrow(
        'No API Key configured'
      );
    });

    it('grades the translation with the passage text and the no-invented-corrections rule', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"verdict":{}}' } }] }),
      });

      const raw = await evaluateTranslationRound(
        roundCards,
        'Вчера я пригласил друга в гости.',
        'Yesterday I invited a friend to my house.',
        settings
      );

      const body = JSON.parse(fetch.mock.calls[0][1].body);
      const systemPrompt = body.messages[0].content;

      expect(raw).toBe('{"verdict":{}}');
      expect(systemPrompt).toContain('Вчера я пригласил друга в гости.');
      expect(systemPrompt).toContain('NEVER invent changes');
      expect(systemPrompt).toContain('invite over');
      expect(body.temperature).toBe(0.3);
      expect(body.max_tokens).toBe(8000);
      expect(body.messages[1].content).toContain('Yesterday I invited a friend to my house.');
    });

    it('surfaces the empty-content error when the model returns nothing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '' } }] }),
      });

      await expect(
        evaluateTranslationRound(roundCards, 'passage', 'translation', settings)
      ).rejects.toThrow('ran out of tokens');
    });

    it('surfaces the API error message on a failed response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: 'Rate limit reached' } }),
      });

      await expect(
        evaluateTranslationRound(roundCards, 'passage', 'translation', settings)
      ).rejects.toThrow('Rate limit reached');
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

  describe('OPENAI_MODEL_OPTIONS catalog', () => {
    it('contains exactly 21 models, no "(long context)" variants, and includes gpt-4o-mini', () => {
      expect(OPENAI_MODEL_OPTIONS).toHaveLength(21);
      expect(
        OPENAI_MODEL_OPTIONS.every(
          (o) => !o.label.includes('(long context)') && !o.value.includes('long-context')
        )
      ).toBe(true);
      expect(OPENAI_MODEL_OPTIONS.some((o) => o.value === 'gpt-4o-mini')).toBe(true);
      expect(
        OPENAI_MODEL_OPTIONS.every(
          (o) => o.label === `${o.value} — ${o.limits}` && /TPM · .* RPM · .* TPD/.test(o.limits)
        )
      ).toBe(true);
    });
  });
});
