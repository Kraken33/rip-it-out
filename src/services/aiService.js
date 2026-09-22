import { generateDescriptionPrompt, generateExportPrompt, parseImportJSON } from '../prompts';

/**
 * Validate a Groq API Key by testing models endpoint
 * @param {string} apiKey
 * @returns {Promise<boolean>}
 */
export async function validateGroqKey(apiKey) {
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Validate an OpenAI API Key by testing models endpoint
 * @param {string} apiKey
 * @returns {Promise<boolean>}
 */
export async function validateOpenAIKey(apiKey) {
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Transcribe audio blob using Groq Whisper API (or OpenAI Whisper API fallback)
 * @param {Blob} audioBlob
 * @param {Object} settings
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBlob, settings) {
  const groqKey = settings.groqApiKey?.trim();
  const openaiKey = settings.openaiApiKey?.trim();

  if (!groqKey && !openaiKey) {
    throw new Error('Please configure a Groq or OpenAI API Key in Settings to enable Speech-to-Text.');
  }

  const isGroq = Boolean(groqKey);
  const apiKey = isGroq ? groqKey : openaiKey;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions';
  const model = isGroq ? 'whisper-large-v3' : 'whisper-1';

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', model);
  formData.append('language', 'en');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `Transcription failed (${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.text || '';
}

const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-4o-mini';

/**
 * Supported OpenAI chat model catalog for the Settings selector.
 * Limits (TPM/RPM/TPD) are informational display metadata only.
 */
export const OPENAI_MODEL_OPTIONS = [
  { value: 'gpt-6-astra', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.6-sol', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.6-terra', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.6-luna', limits: '500K TPM · 500 RPM · 5M TPD' },
  { value: 'gpt-5.5', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.5-pro', limits: '50K TPM · 50 RPM · 500K TPD' },
  { value: 'gpt-5.4', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.4-pro', limits: '50K TPM · 50 RPM · 900K TPD' },
  { value: 'gpt-5.4-mini', limits: '200K TPM · 500 RPM · 2M TPD' },
  { value: 'gpt-5.4-nano', limits: '200K TPM · 500 RPM · 2M TPD' },
  { value: 'gpt-5.3-codex', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.2', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5.2-pro', limits: '50K TPM · 50 RPM · 900K TPD' },
  { value: 'gpt-5.1', limits: '500K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-5', limits: '500K TPM · 500 RPM · 1.5M TPD' },
  { value: 'gpt-5-pro', limits: '50K TPM · 50 RPM · 90K TPD' },
  { value: 'gpt-5-mini', limits: '500K TPM · 500 RPM · 5M TPD' },
  { value: 'gpt-5-nano', limits: '200K TPM · 500 RPM · 2M TPD' },
  { value: 'gpt-4.1', limits: '30K TPM · 500 RPM · 900K TPD' },
  { value: 'gpt-4.1-mini', limits: '200K TPM · 500 RPM · 2M TPD' },
  { value: 'gpt-4o-mini', limits: '200K TPM · 500 RPM · 2M TPD' },
].map(({ value, limits }) => ({ value, limits, label: `${value} — ${limits}` }));

/**
 * New-generation models (gpt-5+, o-series reasoning models) reject the legacy
 * `max_tokens` parameter and require `max_completion_tokens` instead. They also
 * only accept the default temperature, so `temperature` must be omitted for them.
 */
const COMPLETION_TOKENS_MODEL_PATTERN = /^(gpt-[5-9]|o\d)/i;

function requiresCompletionTokensParam(model) {
  return COMPLETION_TOKENS_MODEL_PATTERN.test(model);
}

/**
 * Shared OpenAI chat-completions request used by every text generation/evaluation feature.
 * Requires an OpenAI API key — Groq keys are only used for speech-to-text.
 * @param {Object} settings User settings (needs openaiApiKey; openaiModel optional)
 * @param {Object} options { messages, temperature, maxTokens }
 * @returns {Promise<string>} Raw assistant message content (may be an empty string)
 */
async function requestOpenAIChat(settings, { messages, temperature, maxTokens }) {
  const apiKey = settings.openaiApiKey?.trim();
  if (!apiKey) {
    throw new Error('No API Key configured. Please add an OpenAI API Key in Settings.');
  }

  const model = settings.openaiModel || DEFAULT_OPENAI_CHAT_MODEL;
  const body = { model, messages };
  if (requiresCompletionTokensParam(model)) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.temperature = temperature;
    body.max_tokens = maxTokens;
  }

  const response = await fetch(OPENAI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `AI completion failed (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Send user description directly to the OpenAI Chat Completions API and return parsed improvements
 * @param {Object} session
 * @param {Object} settings
 * @param {string} userDescriptionText
 * @returns {Promise<{ improvements: Array, rawResponse: string }>}
 */
export async function generateSeamlessSessionFeedback(session, settings, userDescriptionText) {
  const SOURCE_VERBS = { video: 'watched', book: 'read', article: 'read', podcast: 'listened to', other: 'went through' };
  const verb = SOURCE_VERBS[session.sourceType] || 'went through';
  const maxImp = settings.maxImprovements || 5;

  // Clean, direct system prompt — no multi-step flow, just JSON output
  const systemMessage = `You are an English speaking coach analyzing a non-native speaker's description of a ${session.sourceType} they ${verb}.

Your task: identify up to ${maxImp} spoken English improvements in their text and return them as JSON.

Focus on: natural phrasing, collocations, idioms, reusable constructions. Ignore missing articles (a/an/the).
Formality: ${settings.formality}. Level: ${settings.level}. Focus: ${settings.focusArea === 'all' ? 'any aspect of spoken English' : settings.focusArea}.

Rules for fields:
- "construction": MUST be the abstracted pattern or phrase structure, and it MUST be SHORT: a single clause of roughly 2-7 words with bracket slots (e.g. invite [someone] over, start taking [class] to [purpose]). NEVER copy a whole sentence or chain multiple clauses — a long pattern like "If I wake up at [time], I feel [adjective] and like I haven't had enough sleep" is NOT acceptable; extract the single core structure instead. NEVER put error descriptions or titles here.
- "original": the exact phrase the speaker used.
- "improved": the more natural spoken sentence version.
- "explanation": concise explanation of why this phrasing sounds more natural in spoken English.
- "category": must be one of: grammar, vocabulary, collocation, idiom, pronunciation, structure
- "spoken_frequency": must be one of: very_high, high, medium

You MUST respond with ONLY a valid JSON object in this exact format — no explanation, no markdown, no extra text:
{
  "improvements": [
    {
      "construction": "short single-clause pattern, 2-7 words (e.g. invite [someone] over)",
      "original": "the exact phrase the speaker used",
      "improved": "a natural spoken English version",
      "explanation": "why this sounds more natural in spoken English",
      "category": "one of: grammar, vocabulary, collocation, idiom, pronunciation, structure",
      "spoken_frequency": "one of: very_high, high, medium"
    }
  ]
}`;

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: `Please analyze this text and return improvements as JSON:\n\n"${userDescriptionText}"` },
  ];

  const rawContent = await requestOpenAIChat(settings, {
    messages,
    temperature: 0.3,
    maxTokens: 8000,
  });

  const parsed = parseImportJSON(rawContent);
  if (!parsed.success) {
    // If content was genuinely empty (the model hit its token limit),
    // give a clearer message instead of the generic parse error.
    if (!rawContent.trim()) {
      throw new Error(
        'The AI model ran out of tokens before producing output. Try a shorter description, or switch to a different OpenAI model in Settings.'
      );
    }
    throw new Error(parsed.error || 'Failed to parse AI response into improvements.');
  }

  return {
    improvements: parsed.improvements.map(imp => ({ ...imp, context: imp.context || userDescriptionText })),
    rawResponse: rawContent,
  };
}

/**
 * Stream conversational chat reply from AI coach
 * @param {Object} session
 * @param {Array} messages List of prior message objects { role, content }
 * @param {Object} settings
 * @param {Function} [onChunk] Callback for streaming text updates
 * @returns {Promise<string>} Full assistant reply text
 */
export async function streamSeamlessChatCompletion(session, messages, settings, onChunk) {
  const SOURCE_VERBS = { video: 'watched', book: 'read', article: 'read', podcast: 'listened to', other: 'went through' };
  const verb = SOURCE_VERBS[session?.sourceType] || 'went through';

  const systemMessage = `You are a supportive and friendly English speaking coach. The user is describing a ${session?.sourceType || 'content'} titled "${session?.title || 'Practice Session'}" that they ${verb}.
Respond naturally to what they share, validate their ideas, and ask 1 engaging follow-up question to keep the conversation flowing. Keep your reply concise (2-4 sentences). Formality: ${settings.formality || 'casual'}.`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const reply = await requestOpenAIChat(settings, {
    messages: formattedMessages,
    temperature: 0.7,
    maxTokens: 1000,
  });
  if (onChunk && reply) {
    onChunk(reply);
  }
  return reply;
}

/**
 * Generate the Russian practice passage for one translation round.
 * Passage generation and evaluation are separate calls so each carries its own
 * prompt, temperature and token budget.
 *
 * @param {Array} roundCards Target construction items for the current round
 * @param {Object} settings User configuration settings
 * @param {Array} [history] Prior passage/translation turns (no verdict payloads)
 * @returns {Promise<string>} Russian passage with [[Russian phrase|target]] tags
 */
export async function generateTranslationRoundPassage(roundCards = [], settings = {}, history = []) {
  const phraseList = roundCards
    .map((c, i) => `${i + 1}. Construction: "${c.construction || c.improved}" (Target usage: "${c.improved}")`)
    .join('\n');

  const systemMessage = `You are an English speaking coach and translation trainer.
Your task is to write the Russian source passage for a Russian-to-English translation round.

The target constructions for this round are:
${phraseList}

Rules:
1. Write ONE short, natural passage in RUSSIAN (на русском языке) containing natural Russian equivalents of these target constructions.
2. CRITICAL TAG FORMAT: Wrap each targeted Russian phrase in double brackets like: [[Russian phrase|Target English Construction]] (e.g. [[пригласил друга в гости|invite over]]).
3. Output ONLY the Russian passage with the tagged phrases — no heading, no English translation, no commentary, and never translate the passage yourself.
4. Do not reuse a passage topic that already appeared earlier in this conversation.

Constraints: Level: ${settings.level || 'intermediate'}. Formality: ${settings.formality || 'casual'}. Keep the passage to 3-5 sentences.`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    ...history
      .filter((m) => m && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: 'Write the Russian passage for this round now.' },
  ];

  const reply = await requestOpenAIChat(settings, {
    messages: formattedMessages,
    temperature: 0.7,
    maxTokens: 1000,
  });
  if (!reply.trim()) {
    throw new Error(
      'The AI model ran out of tokens before producing output. Try a shorter round, or switch to a different OpenAI model in Settings.'
    );
  }
  return reply;
}

/**
 * Evaluate the learner's English translation for the current round.
 * Returns the raw model reply; interpret it with parseTranslationVerdict.
 *
 * @param {Array} roundCards Target construction items for the current round
 * @param {string} passageText The Russian passage the learner translated
 * @param {string} userTranslation The learner's English translation
 * @param {Object} settings User configuration settings
 * @returns {Promise<string>} Raw verdict JSON text
 */
export async function evaluateTranslationRound(roundCards = [], passageText = '', userTranslation = '', settings = {}) {
  const phraseList = roundCards
    .map((c, i) => `${i + 1}. Construction: "${c.construction || c.improved}"`)
    .join('\n');

  const systemMessage = `You are an English speaking coach grading a Russian-to-English translation exercise.

The learner was given this Russian passage:
"${passageText}"

The target constructions for this round are:
${phraseList}

Rules:
1. Compare the learner's English translation against the Russian passage above.
2. Report EVERY target construction exactly once in "constructions":
   - "used": true when the learner attempted that construction, false when it is absent from their translation.
   - "quality": "natural" or "awkward" when "used" is true; null when "used" is false.
   - "mine": the learner's own phrase for that construction, or null when they did not use it.
   - "better": a natural way to use that construction (required when "quality" is "awkward" or "used" is false).
   - "note": one short sentence explaining the problem; null when the construction is natural.
3. If the translation is already natural and every construction is correct, set "rewrite_needed" to false, leave "rewrite" empty and say so in "summary". NEVER invent changes, corrections or "more natural" alternatives for a correct sentence.
4. Otherwise set "rewrite_needed" to true and put a natural English version of the LEARNER'S OWN sentence in "rewrite", keeping their meaning and wording.

Respond with ONLY this JSON object — no markdown, no explanation, no extra text:
{
  "verdict": {
    "summary": "one short sentence",
    "rewrite_needed": false,
    "rewrite": "",
    "constructions": [
      { "target": "invite over", "used": true, "quality": "natural", "mine": "...", "better": "...", "note": null }
    ]
  }
}

Constraints: Level: ${settings.level || 'intermediate'}. Write the summary, the notes and the rewrite in English.`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: `Here is my English translation of the passage:\n\n"${userTranslation}"` },
  ];

  const rawContent = await requestOpenAIChat(settings, {
    messages: formattedMessages,
    temperature: 0.3,
    maxTokens: 8000,
  });
  if (!rawContent.trim()) {
    throw new Error(
      'The AI model ran out of tokens before producing output. Try a shorter translation, or switch to a different OpenAI model in Settings.'
    );
  }
  return rawContent;
}



/**
 * Fetch text-to-speech audio Blob from OpenAI Speech API
 * @param {string} text
 * @param {string} voice
 * @param {string} apiKey
 * @returns {Promise<Blob>}
 */
export async function fetchOpenAITTS(text, voice = 'alloy', apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API Key is required for Realistic Neural TTS.');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice || 'alloy',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `OpenAI TTS failed (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  return await response.blob();
}
