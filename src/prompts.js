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

/**
 * Prompt #5 — Multi-Round Translation Practice Prompt
 * Instructs LLM to generate Russian passages with tagged target constructions across 4-5 rounds.
 */
export function generateTranslationPracticePrompt(improvements, settings) {
  const phraseList = improvements
    .map(
      (imp, i) =>
        `${i + 1}. Construction: "${imp.construction || imp.improved}"
   Example / Usage: "${imp.improved}"`
    )
    .join('\n\n');

  return `You are an English speaking coach and translation trainer.

I am practicing the following ${improvements.length} English constructions today:

${phraseList}

Your task:
1. Divide these constructions across 4 to 5 short practice rounds (3 to 5 constructions per round).
2. For ROUND 1, write a short, natural passage in RUSSIAN (на русском языке). In the passage, embed the target constructions translated into natural Russian.
3. CRITICAL FORMATTING: Wrap each targeted Russian phrase using double brackets like this: [[Russian phrase|Target English Construction]] (e.g. [[пригласил друга в гости|invite over]]).
4. Stop and wait for my ENGLISH translation of the passage.
5. After I translate into English, evaluate how accurately and naturally I used the target constructions, offer quick feedback, and then present ROUND 2 with the next passage.

Constraints:
- Russian passages must sound natural and conversational.
- Target level: ${settings?.level || 'intermediate'}
- Focus area: Spoken English translation accuracy.

Please start with ROUND 1 now (give the Russian passage with tagged constructions and ask me to translate it to English):`;
}

// ── JSON Extraction Helpers ────────────────────────────────────────

/**
 * Extract the JSON object from an LLM response, tolerating markdown code
 * fences and surrounding prose.
 *
 * @param {string} text - Raw LLM response
 * @returns {string|null} Candidate JSON string, or null when there is no input
 */
export function extractJsonObject(text) {
  if (!text || !text.trim()) return null;

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

  return jsonStr;
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

  const jsonStr = extractJsonObject(text);

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
    
    // Ensure construction field exists and is an abstracted pattern, not a meta error title
    const rawConst = (item.construction || '').trim();
    const isMetaExplanation = !rawConst || /usage|duplicate|error|mistake|repetition|redundancy|missing|incorrect|wrong/i.test(rawConst);
    const finalConstruction = isMetaExplanation ? (item.improved || item.original) : rawConst;

    const processedItem = {
      ...item,
      construction: finalConstruction,
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

// ── Translation Verdict Parser ─────────────────────────────────────

const NATURAL_QUALITY_ALIASES = ['natural', 'native', 'correct', 'good', 'ok', 'fine'];
const AWKWARD_QUALITY_ALIASES = ['awkward', 'unnatural', 'wrong', 'incorrect', 'forced', 'stilted', 'off'];

/**
 * Normalize a quality label into the two states the UI renders.
 * @param {unknown} value
 * @returns {'natural'|'awkward'|null}
 */
function normalizeQuality(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (NATURAL_QUALITY_ALIASES.includes(normalized)) return 'natural';
  if (AWKWARD_QUALITY_ALIASES.includes(normalized)) return 'awkward';
  return null;
}

/**
 * @param {unknown} value
 * @returns {string|null} Trimmed string, or null when absent/blank
 */
function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Parse a translation evaluation response into a renderable verdict.
 *
 * Unlike parseImportJSON, an evaluation with nothing to fix is a SUCCESS:
 * the response echoes the round's target list, so "every construction was
 * used naturally" is a complete verdict rather than an empty list.
 *
 * @param {string} text - Raw LLM evaluation response
 * @returns {{ success: boolean, verdict?: Object, error?: string }}
 */
export function parseTranslationVerdict(text) {
  if (!text || !text.trim()) {
    return { success: false, error: 'Empty evaluation response.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch {
    return { success: false, error: 'Evaluation result was not valid JSON.' };
  }

  const verdict = parsed?.verdict;
  if (!verdict || typeof verdict !== 'object') {
    return { success: false, error: 'Evaluation result is missing the "verdict" object.' };
  }

  if (!Array.isArray(verdict.constructions) || verdict.constructions.length === 0) {
    return {
      success: false,
      error: 'Evaluation result is missing the per-target "constructions" list.',
    };
  }

  const constructions = [];
  for (const item of verdict.constructions) {
    const target = optionalText(item?.target);
    if (!target) {
      return { success: false, error: 'Every evaluated construction needs a "target" name.' };
    }

    if (typeof item.used !== 'boolean') {
      return { success: false, error: `Construction "${target}" is missing the "used" flag.` };
    }

    const quality = item.used ? normalizeQuality(item.quality) : null;
    if (item.used && !quality) {
      return {
        success: false,
        error: `Construction "${target}" must be classified as "natural" or "awkward".`,
      };
    }

    constructions.push({
      target,
      used: item.used,
      quality,
      mine: optionalText(item.mine),
      better: optionalText(item.better),
      note: optionalText(item.note),
    });
  }

  const rewrite = optionalText(verdict.rewrite) || '';

  // Honour an explicit flag when the model sends one; otherwise fall back to
  // the presence of a rewrite so an omitted flag cannot hide the corrected text.
  const flag = typeof verdict.rewrite_needed === 'boolean' ? verdict.rewrite_needed : Boolean(rewrite);
  const rewriteNeeded = flag && Boolean(rewrite);

  return {
    success: true,
    verdict: {
      summary: optionalText(verdict.summary) || '',
      rewriteNeeded,
      rewrite: rewriteNeeded ? rewrite : '',
      constructions,
    },
  };
}

