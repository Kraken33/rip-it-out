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

/**
 * Send user description directly to AI service (Groq or OpenAI) and return parsed improvements
 * @param {Object} session
 * @param {Object} settings
 * @param {string} userDescriptionText
 * @returns {Promise<{ improvements: Array, rawResponse: string }>}
 */
export async function generateSeamlessSessionFeedback(session, settings, userDescriptionText) {
  const groqKey = settings.groqApiKey?.trim();
  const openaiKey = settings.openaiApiKey?.trim();

  if (!groqKey && !openaiKey) {
    throw new Error('No API Key configured. Please add a Groq API Key or OpenAI API Key in Settings.');
  }

  const isGroq = Boolean(groqKey);
  const apiKey = isGroq ? groqKey : openaiKey;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  // Fallback candidate models for Groq (free-plan supported models only)
  const groqCandidateModels = [
    settings.groqModel || 'openai/gpt-oss-20b',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
  ];

  const SOURCE_VERBS = { video: 'watched', book: 'read', article: 'read', podcast: 'listened to', other: 'went through' };
  const verb = SOURCE_VERBS[session.sourceType] || 'went through';
  const maxImp = settings.maxImprovements || 5;

  // Clean, direct system prompt — no multi-step flow, just JSON output
  const systemMessage = `You are an English speaking coach analyzing a non-native speaker's description of a ${session.sourceType} they ${verb}.

Your task: identify up to ${maxImp} spoken English improvements in their text and return them as JSON.

Focus on: natural phrasing, collocations, idioms, reusable constructions. Ignore missing articles (a/an/the).
Formality: ${settings.formality}. Level: ${settings.level}. Focus: ${settings.focusArea === 'all' ? 'any aspect of spoken English' : settings.focusArea}.

Rules for fields:
- "construction": MUST be the abstracted pattern or phrase structure (e.g. invite [someone] over to [place], want to [verb], test if [something] works). NEVER put error descriptions or titles here.
- "original": the exact phrase the speaker used.
- "improved": the more natural spoken sentence version.
- "explanation": concise explanation of why this phrasing sounds more natural in spoken English.
- "category": must be one of: grammar, vocabulary, collocation, idiom, pronunciation, structure
- "spoken_frequency": must be one of: very_high, high, medium

You MUST respond with ONLY a valid JSON object in this exact format — no explanation, no markdown, no extra text:
{
  "improvements": [
    {
      "construction": "abstracted pattern (e.g. invite [someone] over)",
      "original": "the exact phrase the speaker used",
      "improved": "a natural spoken English version",
      "explanation": "why this sounds more natural in spoken English",
      "category": "one of: grammar, vocabulary, collocation, idiom, pronunciation, structure",
      "spoken_frequency": "one of: very_high, high, medium"
    }
  ]
}`;

  const requestModel = async (modelName) => {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Please analyze this text and return improvements as JSON:\n\n"${userDescriptionText}"` },
        ],
        temperature: 0.3,
        // Reasoning models (openai/gpt-oss-*, qwen3) need large budgets:
        // they spend thousands of tokens thinking before outputting.
        max_tokens: 8000,
      }),
    });
  };

  let response;
  let usedModel = null;
  if (isGroq) {
    // Try primary chosen model, fallback on model errors or JSON validation errors
    const triedModels = new Set();
    for (const m of groqCandidateModels) {
      if (triedModels.has(m)) continue;
      triedModels.add(m);
      response = await requestModel(m);
      if (response.ok) { usedModel = m; break; }

      const errText = await response.clone().text();
      const isRetryableError = (
        errText.includes('model_not_found') ||
        errText.includes('does not exist') ||
        errText.includes('model_decommissioned') ||
        errText.includes('json_validate_failed')
      );
      if (!isRetryableError) break; // Auth or rate-limit errors — don't retry
    }
  } else {
    response = await requestModel('gpt-4o-mini');
  }

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
  const choice = data.choices?.[0]?.message;

  // Reasoning models (openai/gpt-oss-*, qwen3) put output in content but
  // sometimes run out of tokens mid-reasoning and leave content empty.
  // Fallback: try to extract JSON from the reasoning trace.
  let rawContent = choice?.content || '';
  if (!rawContent.trim() && choice?.reasoning) {
    rawContent = choice.reasoning;
  }

  const parsed = parseImportJSON(rawContent);
  if (!parsed.success) {
    // If content was genuinely empty (reasoning model hit token limit),
    // give a clearer message instead of the generic parse error.
    if (!choice?.content?.trim()) {
      throw new Error(
        'The AI model ran out of tokens before producing output. Try a shorter description, or switch to a different Groq model in Settings.'
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
  const groqKey = settings.groqApiKey?.trim();
  const openaiKey = settings.openaiApiKey?.trim();

  if (!groqKey && !openaiKey) {
    throw new Error('No API Key configured. Please add a Groq API Key or OpenAI API Key in Settings.');
  }

  const isGroq = Boolean(groqKey);
  const apiKey = isGroq ? groqKey : openaiKey;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const modelName = isGroq
    ? (settings.groqModel || 'openai/gpt-oss-20b')
    : 'gpt-4o-mini';

  const SOURCE_VERBS = { video: 'watched', book: 'read', article: 'read', podcast: 'listened to', other: 'went through' };
  const verb = SOURCE_VERBS[session?.sourceType] || 'went through';

  const systemMessage = `You are a supportive and friendly English speaking coach. The user is describing a ${session?.sourceType || 'content'} titled "${session?.title || 'Practice Session'}" that they ${verb}.
Respond naturally to what they share, validate their ideas, and ask 1 engaging follow-up question to keep the conversation flowing. Keep your reply concise (2-4 sentences). Formality: ${settings.formality || 'casual'}.`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Chat completion failed (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  if (onChunk && reply) {
    onChunk(reply);
  }
  return reply;
}

/**
 * Stream translation practice completion for a round of target constructions
 * @param {Array} roundCards Target construction items for current round
 * @param {Array} messages List of prior message objects { role, content }
 * @param {Object} settings User configuration settings
 * @param {Function} [onChunk] Callback for streaming text updates
 * @returns {Promise<string>} Full assistant reply text
 */
export async function streamTranslationPracticeCompletion(roundCards = [], messages = [], settings = {}, onChunk) {
  const groqKey = settings.groqApiKey?.trim();
  const openaiKey = settings.openaiApiKey?.trim();

  if (!groqKey && !openaiKey) {
    throw new Error('No API Key configured. Please add a Groq API Key or OpenAI API Key in Settings.');
  }

  const isGroq = Boolean(groqKey);
  const apiKey = isGroq ? groqKey : openaiKey;
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const modelName = isGroq
    ? (settings.groqModel || 'openai/gpt-oss-20b')
    : 'gpt-4o-mini';

  const phraseList = roundCards
    .map((c, i) => `${i + 1}. Construction: "${c.construction || c.improved}" (Target usage: "${c.improved}")`)
    .join('\n');

  const systemMessage = `You are an English speaking coach and translation trainer.
Your task is to run a Russian-to-English translation practice round.

The target constructions for this round are:
${phraseList}

Rules:
1. If generating a new passage (or starting a round):
   Write a short, natural passage in RUSSIAN (на русском языке) containing natural Russian equivalents of these target constructions.
   CRITICAL TAG FORMAT: Wrap each targeted Russian phrase in double brackets like: [[Russian phrase|Target English Construction]] (e.g. [[пригласил друга в гости|invite over]]).
2. If evaluating user's translation:
   Briefly evaluate how accurately and naturally they translated the Russian text into English and used the target constructions. Point out any errors and give friendly feedback.

Constraints: Level: ${settings.level || 'intermediate'}. Formality: ${settings.formality || 'casual'}. Keep response concise and helpful.`;

  const formattedMessages = [
    { role: 'system', content: systemMessage },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Translation practice completion failed (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  if (onChunk && reply) {
    onChunk(reply);
  }
  return reply;
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
