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
- Keep each construction SHORT: a single clause of roughly 2-7 words with bracket slots (e.g. "start taking [class] to [purpose]"). NEVER copy a whole sentence or chain multiple clauses — a pattern like "If I wake up at [time], I feel [adjective] and like I haven't had enough sleep" is TOO LONG; extract the single core structure instead.
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
      "construction": "short reusable pattern, single clause of 2-7 words (e.g. invite [someone] over)",
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
- "construction" MUST be the abstracted pattern or phrase structure, kept SHORT: a single clause of roughly 2-7 words with bracket slots (e.g. "start taking [class] to [purpose]"), never a whole sentence or a multi-clause pattern like "If I wake up at [time], I feel [adjective] and like I haven't had enough sleep".
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
 * Prompt #5 — Unlimited Two-per-Round Translation Practice Prompt
 * Instructs LLM to generate Russian passages with tagged target constructions,
 * exactly 2 per round, continuing until the learner asks to finish.
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
1. Practice these constructions in unlimited short rounds with exactly 2 target constructions per round (take the next 2 unpracticed constructions each round; only reuse a construction after every construction has been practiced once).
2. For ROUND 1, write a short, natural passage in RUSSIAN (на русском языке). In the passage, embed the round's 2 target constructions translated into natural Russian.
3. CRITICAL FORMATTING: Wrap each targeted Russian phrase using double brackets like this: [[Russian phrase|Target English Construction]] (e.g. [[пригласил друга в гости|invite over]]).
4. Stop and wait for my ENGLISH translation of the passage.
5. After I translate into English, evaluate how accurately and naturally I used the target constructions, offer quick feedback, then ask whether I want NEXT ROUND (a fresh passage with the next 2 constructions) or to FINISH practice. Continue with as many rounds as I request — there is no fixed round limit.

Constraints:
- Russian passages must sound natural and conversational.
- Target level: ${settings?.level || 'intermediate'}
- Focus area: Spoken English translation accuracy.

Please start with ROUND 1 now (give the Russian passage with tagged constructions and ask me to translate it to English):`;
}

// ── JSON Extraction Helpers ────────────────────────────────────────

const allowedCategories = ['grammar', 'vocabulary', 'collocation', 'idiom', 'pronunciation', 'structure'];
const allowedFrequencies = ['very_high', 'high', 'medium'];

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


// ── Translation Story Session ─────────────────────────────────────

/**
 * Small per-round cap so end-of-session aggregation stays within the
 * session-wide `maxImprovements` budget after a few rounds.
 */
export const STORY_ROUND_CONSTRUCTION_CAP = 3;

/**
 * Resolve the ONLY topic input for a story passage: the learner-provided story
 * topic/demands captured at session setup. A story session started without
 * demands is saved with an auto-generated display title (`Story — <date>`);
 * that title is a Library/replay label and MUST NOT steer generated stories,
 * so it is deliberately never read here.
 *
 * @param {Object} session - Session record (storyDemands)
 * @returns {string} Trimmed learner demands, or '' when the learner gave none
 */
export function resolveStoryTopic(session) {
  return (session?.storyDemands || '').trim();
}

/**
 * System prompt for one translation-story round passage: ONE short Russian
 * story in natural spoken register, grounded in the learner's story
 * topic/demands when given (free everyday topic otherwise), at the learner
 * level, on a topic not already used this session. Output is ONLY the Russian
 * passage text.
 *
 * @param {Object} session - Session record (storyDemands is the topic source)
 * @param {Object} settings - Learner settings (level, formality)
 * @param {string[]} historyTopics - Topics/passages already used this session
 * @returns {string}
 */
export function generateStoryPassagePrompt(session, settings, historyTopics = []) {
  const usedTopics = (Array.isArray(historyTopics) ? historyTopics : [])
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter(Boolean);

  const usedTopicsBlock = usedTopics.length > 0
    ? `\n\nTopics already used in this session (do NOT reuse them):\n${usedTopics
        .map((t, i) => `${i + 1}. ${t}`)
        .join('\n')}\nYou MUST pick a FRESH topic that is not in the list above.`
    : '';

  const topic = resolveStoryTopic(session);
  const demandsBlock = topic
    ? `\n\nThe learner specifically asked to practice: "${topic}". The story MUST match this request.`
    : '';
  const topicBlock = topic
    ? ''
    : `\n\nThe learner gave no topic, so the subject is yours to pick: choose ONE fresh, concrete everyday topic (for example running into a neighbour, a small problem at home, or getting ready for the day) and make the whole story about it.`;

  return `You are a Russian language tutor creating story-translation practice material for an English learner.

Write ONE short natural Russian story (3-6 sentences) in natural spoken Russian — the way a native speaker would actually say it out loud to a friend. Use conversational, everyday register: short spoken sentences, common everyday vocabulary, and natural spoken constructions, never literary, bookish, or formal narration.${topicBlock}${demandsBlock}${usedTopicsBlock}

Rules:
- Write ONLY the Russian story text. No title, no English translation, no commentary, no formatting marks.
- The story must be understandable for a learner at the ${settings.level || 'intermediate'} level.
- Keep it about concrete everyday situations the learner could talk about.
- Do NOT mention today's date, the current year, a month name, or a literal calendar date. Ordinary relative time words like "yesterday", "this morning", or "last week" are fine.
- Formality level: ${settings.formality || 'casual'}.`;
}


/**
 * System prompt for per-round translation feedback: a fluent daily-speaking
 * improved version of the learner's translation plus candidate constructions
 * in the vault improvement shape (capped per round).
 *
 * @param {string} passageText - The Russian story passage being translated
 * @param {Object} settings - Learner settings (level)
 * @returns {string}
 */
export function generateStoryFeedbackPrompt(passageText, settings) {
  return `You are an English speaking coach evaluating a learner's English translation of a Russian story.

The Russian story passage:
"${passageText}"

Evaluate the learner's English translation and respond with structured feedback:

1. "summary": one short sentence of overall feedback for the learner.
2. "already_natural": true when the translation is already natural, fluent spoken English; false otherwise.
3. "improved_version": a comprehensive, fluent version of the LEARNER'S OWN translation optimized for daily speaking — keep their meaning and wording where natural, fix errors, and prefer fluent spoken phrasing over formal written style. When "already_natural" is true, leave this EMPTY: affirm the success in "summary" and NEVER invent a rewrite, corrections, or "more natural" alternatives for a correct translation.
4. "constructions": up to ${STORY_ROUND_CONSTRUCTION_CAP} reusable spoken English constructions demonstrated by (or missing from) the translation. Even for a correct translation, list the constructions the learner demonstrated as candidates. For each:
   - "construction": the abstracted pattern, kept SHORT: a single clause of roughly 2-7 words with bracket slots (e.g. "start taking [class] to [purpose]"), never a whole sentence or a multi-clause pattern like "If I wake up at [time], I feel [adjective] and like I haven't had enough sleep".
   - "original": the exact phrase the learner used (or attempted).
   - "improved": the natural spoken version of that phrase.
   - "explanation": why this construction/phrasing sounds more natural in spoken English.
   - "category": one of: grammar, vocabulary, collocation, idiom, pronunciation, structure.
   - "spoken_frequency": one of: very_high, high, medium.

Respond with ONLY this JSON object — no markdown, no explanation, no extra text:
{
  "feedback": {
    "summary": "one short sentence",
    "already_natural": false,
    "improved_version": "",
    "constructions": [
      {
        "construction": "invite [someone] over",
        "original": "invited him to my home",
        "improved": "invited him over",
        "explanation": "...",
        "category": "collocation",
        "spoken_frequency": "very_high"
      }
    ]
  }
}

Constraints: Level: ${settings.level || 'intermediate'}. Write the summary, explanations and improved version in English.`;
}


/**
 * Normalize one candidate construction entry into the vault improvement shape,
 * mirroring parseImportJSON's per-item rules.
 *
 * @param {unknown} item
 * @param {string[]} warnings - Mutable warnings sink
 * @returns {Object|null} Normalized entry, or null when the item is unusable
 */
function normalizeStoryConstruction(item, warnings) {
  const original = item?.original?.trim?.();
  const improved = item?.improved?.trim?.();
  const construction = item?.construction?.trim?.();

  if (!construction && (!original || !improved)) {
    warnings.push('Skipped one malformed construction entry.');
    return null;
  }

  let category = item?.category;
  if (!allowedCategories.includes(category)) {
    if (category) warnings.push(`Removed invalid category '${category}'.`);
    category = 'vocabulary';
  }

  let freq = item?.spoken_frequency;
  if (!allowedFrequencies.includes(freq)) {
    if (freq) warnings.push(`Removed invalid spoken frequency '${freq}'.`);
    freq = 'medium';
  }

  return {
    construction: construction || improved,
    original: original || '',
    improved: improved || '',
    explanation: item?.explanation?.trim?.() || '',
    category,
    spoken_frequency: freq,
  };
}

/**
 * Parse a per-round story feedback response into a renderable result.
 *
 * An "already natural" translation is a SUCCESS: the improved version stays
 * empty and the demonstrated constructions are still listed as candidates.
 *
 * @param {string} text - Raw LLM feedback response
 * @returns {{ success: boolean, feedback?: Object, warnings?: string[], error?: string }}
 */
export function parseStoryFeedback(text) {
  if (!text || !text.trim()) {
    return { success: false, error: 'Empty feedback response.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch {
    return { success: false, error: 'Feedback result was not valid JSON.' };
  }

  const feedback = parsed?.feedback;
  if (!feedback || typeof feedback !== 'object') {
    return { success: false, error: 'Feedback result is missing the "feedback" object.' };
  }

  if (feedback.constructions != null && !Array.isArray(feedback.constructions)) {
    return { success: false, error: 'Feedback "constructions" must be a list.' };
  }

  const warnings = [];
  const constructions = [];
  for (const item of feedback.constructions || []) {
    const normalized = normalizeStoryConstruction(item, warnings);
    if (normalized) constructions.push(normalized);
  }

  // Enforce the per-round cap client-side so a chatty model cannot overflow
  // the end-of-session aggregation budget.
  if (constructions.length > STORY_ROUND_CONSTRUCTION_CAP) {
    warnings.push(`Capped constructions at ${STORY_ROUND_CONSTRUCTION_CAP} for this round.`);
    constructions.length = STORY_ROUND_CONSTRUCTION_CAP;
  }

  const improvedVersion = optionalText(feedback.improved_version) || '';

  // Honour an explicit flag when the model sends one; otherwise derive it from
  // the absence of an improved version so an omitted flag cannot hide a rewrite.
  const alreadyNatural = typeof feedback.already_natural === 'boolean'
    ? feedback.already_natural && !improvedVersion
    : !improvedVersion;

  return {
    success: true,
    feedback: {
      summary: optionalText(feedback.summary) || '',
      alreadyNatural,
      improvedVersion: alreadyNatural ? '' : improvedVersion,
      constructions,
    },
    warnings,
  };
}

