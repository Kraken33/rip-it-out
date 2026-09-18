// ── Prompt Generators ──────────────────────────────────────────────
// All 4 prompt templates. No AI logic — just string assembly.

const SOURCE_VERBS = {
  video: 'watched',
  book: 'read',
  article: 'read',
  podcast: 'listened to',
  other: 'went through',
};

/**
 * Prompt #1 — Description & Review with Follow-up Questions
 * User copies this into their LLM, then describes what they consumed.
 */
export function generateDescriptionPrompt(session, settings) {
  const verb = SOURCE_VERBS[session.sourceType] || 'went through';
  const maxImp = settings.maxImprovements || 5;

  return `You are an English speaking coach. Your specialty is helping non-native speakers master natural spoken English constructions and patterns.

I'm going to describe a ${session.sourceType} I just ${verb} called "${session.title}". I'll describe it in my own words.

Please follow these steps:

STEP 1: REVIEW MY DESCRIPTION
- Identify spoken English improvements from my text (up to ${maxImp} total across our entire conversation).
- For each improvement, highlight the reusable **construction/pattern** first (e.g., if I said "invited him to my home", the construction is "invite [someone] over to [place]").
- Ignore missing or incorrect articles (a, an, the) entirely. Focus on natural phrasing, collocations, idioms, and constructions.

STEP 2: ASK ME 3 FOLLOW-UP QUESTIONS
- Ask me 3 engaging follow-up questions (in English) about the topic/content I described.
- Wait for my answers to these questions.

STEP 3: REVIEW MY ANSWERS
- After I answer your 3 questions, provide natural spoken feedback on my responses as well.

Constraints:
- Focus on SPOKEN English, not written.
- Formality level: ${settings.formality}
- My current level: ${settings.level}
- Focus area: ${settings.focusArea === 'all' ? 'any aspect of spoken English' : settings.focusArea}

I'll start describing now:`;
}

/**
 * Prompt #2 — Export (JSON extraction based on whole conversation)
 * User sends this at the end of the conversation to get structured data.
 */
export function generateExportPrompt() {
  return `Now please format ALL the improvements suggested across our WHOLE conversation (including my initial description and my answers to your 3 questions) as JSON using this exact structure:

{
  "improvements": [
    {
      "construction": "reusable pattern (e.g. invite [someone] over to [place])",
      "original": "the exact phrase I used",
      "improved": "the more natural spoken sentence version",
      "explanation": "why this construction/phrasing sounds more natural in spoken English",
      "category": "one of: grammar, vocabulary, collocation, idiom, pronunciation, structure",
      "spoken_frequency": "one of: very_high, high, medium"
    }
  ]
}

Rules:
- Output ONLY the JSON block, nothing else.
- Use exactly the field names shown above.
- "construction" MUST be the abstracted pattern or phrase structure.
- "category" must be one of: grammar, vocabulary, collocation, idiom, pronunciation, structure
- "spoken_frequency" must be one of: very_high, high, medium`;
}

/**
 * Prompt #3 — Practice (Russian Scenario Questions Mode)
 * Generates 5 Russian questions that test due English constructions.
 */
export function generatePracticePrompt(improvements, settings) {
  const phraseList = improvements
    .map(
      (imp, i) =>
        `${i + 1}. Construction: "${imp.construction || imp.improved}"
   Context / Example: "${imp.improved}" (instead of "${imp.original}")`
    )
    .join('\n\n');

  return `You are an English speaking coach and roleplay evaluator.

I am practicing the following English constructions today:

${phraseList}

Your task:
1. Ask me 5 distinct questions in RUSSIAN (на русском языке). Each question must create a scenario or context that encourages me to naturally answer in ENGLISH using one or more of the English constructions listed above.
2. Wait for my answers in ENGLISH.
3. After I answer your questions in English, evaluate how naturally I used each targeted construction in my responses, point out any mistakes, and give me feedback on my usage.

Rules:
- Questions must be in RUSSIAN (на русском языке).
- My answers will be in ENGLISH.
- Rate how naturally I used each construction in my English answers.

Constraints:
- Target level: ${settings.level}
- Tone: Helpful, encouraging coach.

Please start by asking the 5 questions in Russian now:`;
}

/**
 * Prompt #4 — Examples (on-demand during review)
 * User copies this to get example sentences for improvements they're reviewing.
 */
export function generateExamplesPrompt(improvements) {
  const phraseList = improvements
    .map(
      (imp, i) =>
        `${i + 1}. Construction: "${imp.construction || imp.improved}"
   Example Sentence: "${imp.improved}"
   Context: Instead of saying "${imp.original}" — ${imp.explanation}`
    )
    .join('\n\n');

  return `I'm practicing these English constructions to sound more natural when speaking. For each item below, give me 3 short example sentences showing how a native speaker would use this exact construction in casual conversation.

${phraseList}

Keep sentences short (under 15 words), casual, and varied in topic.`;
}

// ── JSON Import Parser ─────────────────────────────────────────────

/**
 * Parse and validate pasted LLM output into improvement objects.
 * Handles: raw JSON, markdown code fences, extra text around JSON.
 *
 * @param {string} text - Raw pasted text from user
 * @returns {{ success: boolean, improvements?: Array, error?: string }}
 */
export function parseImportJSON(text) {
  if (!text || !text.trim()) {
    return { success: false, error: 'Empty input. Please paste the JSON output from your LLM.' };
  }

  let jsonStr = text.trim();

  // Try extracting from markdown code fences
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // Try finding JSON object boundaries
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      success: false,
      error: 'Could not parse JSON. Make sure you copied the LLM\'s entire response. Try sending the Export Prompt again.',
    };
  }

  if (!parsed.improvements || !Array.isArray(parsed.improvements)) {
    return {
      success: false,
      error: 'JSON doesn\'t match expected format — missing "improvements" array. Try sending the Export Prompt again.',
    };
  }

  if (parsed.improvements.length === 0) {
    return {
      success: false,
      error: 'The LLM returned 0 improvements. Try describing your content in more detail.',
    };
  }

  const REQUIRED_FIELDS = ['original', 'improved', 'explanation'];
  const validated = [];
  const warnings = [];

  parsed.improvements.forEach((item, index) => {
    const missing = REQUIRED_FIELDS.filter((f) => !item[f] || typeof item[f] !== 'string');
    if (missing.length > 0) {
      warnings.push(`Improvement #${index + 1} is missing: ${missing.join(', ')}. It will be skipped.`);
      return;
    }
    
    // Ensure construction field exists (fallback to improved or original if missing)
    const processedItem = {
      ...item,
      construction: item.construction || item.improved || item.original
    };
    
    validated.push(processedItem);
  });

  if (validated.length === 0) {
    return {
      success: false,
      error: 'No valid improvements found. All items were missing required fields.',
    };
  }

  return {
    success: true,
    improvements: validated,
    warnings: warnings.length > 0 ? warnings : undefined,
    skipped: parsed.improvements.length - validated.length,
  };
}

