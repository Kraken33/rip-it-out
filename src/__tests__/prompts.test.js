import { describe, it, expect } from 'vitest';
import { 
  generateStoryPassagePrompt,
  generateStoryFeedbackPrompt,
  generateConstructionExtractionPrompt,
  resolveStoryTopic,
  parseTranslationVerdict,
  parseStoryFeedback,
  parseExtractedConstruction,
  generateFrequencyDrillPrompt,
  parseFrequencyDrillSentence,
  evaluateFrequencyDrillPrompt,
  parseFrequencyDrillEvaluation,
  generateSentenceDeepStudyPrompt,
  parseSentenceDeepStudy,
  generateSentenceExampleVariationsPrompt,
  parseSentenceExampleVariations,
  evaluatePracticeExercisePrompt,
  parsePracticeExerciseEvaluation,
  VARIETY_MATRIX,
  VARIETY_PRESETS,
  sampleVarietyMatrix
} from '../prompts';

describe('Prompt Orchestrator & Parser', () => {


describe('parseTranslationVerdict', () => {
  const allNatural = {
    verdict: {
      summary: 'Good — natural phrasing throughout.',
      rewrite_needed: false,
      rewrite: '',
      constructions: [
        { target: 'invite over', used: true, quality: 'natural', mine: 'invited him over', better: null, note: null },
        { target: 'plan on', used: true, quality: 'natural', mine: 'plan on going', better: null, note: null },
      ],
    },
  };

  it('accepts a verdict where every construction is already natural', () => {
    const res = parseTranslationVerdict(JSON.stringify(allNatural));

    expect(res.success).toBe(true);
    expect(res.verdict.rewriteNeeded).toBe(false);
    expect(res.verdict.rewrite).toBe('');
    expect(res.verdict.constructions).toHaveLength(2);
    expect(res.verdict.constructions.every((c) => c.quality === 'natural')).toBe(true);
  });

  it('parses a verdict with awkward and unused constructions', () => {
    const json = JSON.stringify({
      verdict: {
        summary: 'Close — two targets need work.',
        rewrite_needed: true,
        rewrite: 'Yesterday I invited a friend over so we could catch up.',
        constructions: [
          {
            target: 'invite over',
            used: true,
            quality: 'awkward',
            mine: 'invited a friend to my house',
            better: 'invited a friend over',
            note: '"over" carries the target',
          },
          {
            target: 'catch up',
            used: false,
            quality: null,
            mine: null,
            better: 'We should catch up soon.',
            note: 'target missing',
          },
        ],
      },
    });

    const res = parseTranslationVerdict(json);

    expect(res.success).toBe(true);
    expect(res.verdict.rewriteNeeded).toBe(true);
    expect(res.verdict.rewrite).toContain('invited a friend over');
    expect(res.verdict.constructions[0]).toMatchObject({ target: 'invite over', used: true, quality: 'awkward' });
    expect(res.verdict.constructions[1]).toMatchObject({ target: 'catch up', used: false, quality: null });
  });

  it('extracts a verdict from markdown code fences and surrounding prose', () => {
    const wrapped = `Here is my evaluation:\n\`\`\`json\n${JSON.stringify(allNatural)}\n\`\`\`\nLet me know if you want detail.`;
    const res = parseTranslationVerdict(wrapped);

    expect(res.success).toBe(true);
    expect(res.verdict.constructions).toHaveLength(2);
  });

  it('extracts a verdict from raw JSON with surrounding prose', () => {
    const wrapped = `Sure! ${JSON.stringify(allNatural)} That is my verdict.`;
    expect(parseTranslationVerdict(wrapped).success).toBe(true);
  });

  it('normalizes loose quality labels', () => {
    const json = JSON.stringify({
      verdict: {
        summary: 'ok',
        rewrite_needed: false,
        constructions: [{ target: 'turn down', used: true, quality: 'Unnatural' }],
      },
    });

    const res = parseTranslationVerdict(json);

    expect(res.success).toBe(true);
    expect(res.verdict.constructions[0].quality).toBe('awkward');
  });

  it('derives rewriteNeeded from a rewrite when the flag is omitted', () => {
    const json = JSON.stringify({
      verdict: {
        summary: 'ok',
        rewrite: 'Yesterday I invited a friend over.',
        constructions: [{ target: 'invite over', used: true, quality: 'awkward' }],
      },
    });

    const res = parseTranslationVerdict(json);

    expect(res.success).toBe(true);
    expect(res.verdict.rewriteNeeded).toBe(true);
  });

  it('rejects a payload without the constructions list', () => {
    const res = parseTranslationVerdict(JSON.stringify({ verdict: { summary: 'nice' } }));

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/constructions/);
  });

  it('rejects a construction that is used but unclassified', () => {
    const json = JSON.stringify({
      verdict: { constructions: [{ target: 'invite over', used: true }] },
    });

    const res = parseTranslationVerdict(json);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/natural.*awkward/);
  });

  it('rejects unparseable output and empty input', () => {
    expect(parseTranslationVerdict('The model rambled without any JSON').success).toBe(false);
    expect(parseTranslationVerdict('').success).toBe(false);
    expect(parseTranslationVerdict(null).success).toBe(false);
  });
});

});

describe('Translation Story prompts & parseStoryFeedback', () => {
  const storySession = { storyDemands: 'Weekend in the Countryside', sourceType: 'other' };
  const storySettings = { formality: 'casual', level: 'intermediate', maxImprovements: 5 };

  describe('resolveStoryTopic', () => {
    it('returns the trimmed learner story topic/demands', () => {
      expect(resolveStoryTopic({ storyDemands: '  ordering coffee  ' })).toBe('ordering coffee');
    });

    it('returns an empty string when the learner gave no demands', () => {
      expect(resolveStoryTopic({ storyDemands: '' })).toBe('');
      expect(resolveStoryTopic({ storyDemands: '   ' })).toBe('');
      expect(resolveStoryTopic({})).toBe('');
      expect(resolveStoryTopic(null)).toBe('');
    });

    it('never derives a topic from the session title', () => {
      expect(resolveStoryTopic({ title: 'Weekend in the Countryside' })).toBe('');
      expect(resolveStoryTopic({ title: 'Story — Sep 23, 2026' })).toBe('');
    });
  });

  describe('generateStoryPassagePrompt', () => {
    it('grounds the story in the learner demands and learner level, requesting only Russian text', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings);
      expect(prompt).toContain('Weekend in the Countryside');
      expect(prompt).toContain('intermediate');
      expect(prompt).toMatch(/ONE short natural Russian story/i);
      expect(prompt).toMatch(/ONLY the Russian story text/i);
      expect(prompt).toMatch(/No title, no English translation, no commentary/i);
    });

    it('requires natural spoken Russian and conversational flow without hardcoded marker strings', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings);
      expect(prompt).toMatch(/natural spoken Russian/i);
      expect(prompt).toMatch(/out loud/i);
      expect(prompt).toMatch(/conversational, everyday register/i);
      expect(prompt).toMatch(/never literary, bookish, or formal narration/i);
      expect(prompt).not.toContain('Короче');
      expect(prompt).not.toContain('Представляешь');
      expect(prompt).not.toContain('В общем');
      expect(prompt).not.toContain('Оказывается');
    });

    it('injects dynamic variety matrix parameters and does not contain hardcoded neighbor/alarm anchor examples', () => {
      const sample = {
        domain: { label: 'Airport & Flight', desc: 'airports' },
        tone: { label: 'Amused / Ironic', desc: 'humorous' },
        format: { label: 'Spoken Anecdote', desc: 'anecdote' },
        catalyst: { label: 'Lost Item', desc: 'lost things' },
      };
      const prompt = generateStoryPassagePrompt({ title: '', storyDemands: '' }, storySettings, [], sample);
      expect(prompt).toContain('Airport & Flight');
      expect(prompt).toContain('Amused / Ironic');
      expect(prompt).toContain('Spoken Anecdote');
      expect(prompt).toContain('Lost Item');
      expect(prompt).not.toContain('running into a neighbour');
      expect(prompt).not.toContain('getting ready for the day');
    });

    it('forbids calendar-date references while allowing relative time words', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings);
      expect(prompt).toMatch(
        /Do NOT mention today's date, the current year, a month name, or a literal calendar date/i
      );
      expect(prompt).toContain('"yesterday"');
    });

    it('lists used topics and requires a fresh topic when history is provided', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings, [
        'A trip to the market',
        'Meeting a neighbour',
      ]);
      expect(prompt).toContain('A trip to the market');
      expect(prompt).toContain('Meeting a neighbour');
      expect(prompt).toMatch(/FRESH topic/i);
    });

    it('omits the used-topics block for the first round', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings, []);
      expect(prompt).not.toMatch(/already used in this session/i);
    });

    it('includes learner demands and requires the story to match them', () => {
      const prompt = generateStoryPassagePrompt(
        { ...storySession, storyDemands: 'ordering coffee and small talk' },
        storySettings
      );
      expect(prompt).toContain('ordering coffee and small talk');
      expect(prompt).toMatch(/MUST match this request/i);
      // The free-topic fallback must not appear once the learner steered the topic.
      expect(prompt).not.toMatch(/The learner gave no topic/i);
    });

    it('picks a free everyday topic when no demands were given', () => {
      const prompt = generateStoryPassagePrompt({ title: '', storyDemands: '' }, storySettings);
      expect(prompt).not.toMatch(/specifically asked to practice/i);
      expect(prompt).toMatch(/The learner gave no topic/i);
      expect(prompt).toMatch(/fresh, concrete everyday topic/i);
    });

    it('never sends an auto-generated session title to the model', () => {
      const prompt = generateStoryPassagePrompt(
        { title: 'Story — Sep 23, 2026', storyDemands: '' },
        storySettings
      );
      expect(prompt).not.toContain('Story —');
      expect(prompt).not.toContain('Sep 23, 2026');
      expect(prompt).not.toContain('2026');
    });
  });

  describe('Variety Matrix & sampleVarietyMatrix', () => {
    it('defines all required matrix dimensions and presets', () => {
      expect(VARIETY_MATRIX.domains.length).toBeGreaterThanOrEqual(6);
      expect(VARIETY_MATRIX.tones.length).toBeGreaterThanOrEqual(4);
      expect(VARIETY_MATRIX.formats.length).toBeGreaterThanOrEqual(3);
      expect(VARIETY_MATRIX.catalysts.length).toBeGreaterThanOrEqual(4);
      expect(VARIETY_PRESETS.length).toBeGreaterThanOrEqual(4);
    });

    it('samples randomized dimensions and builds a vibeLabel', () => {
      const sample = sampleVarietyMatrix();
      expect(sample.domain).toBeDefined();
      expect(sample.tone).toBeDefined();
      expect(sample.format).toBeDefined();
      expect(sample.catalyst).toBeDefined();
      expect(typeof sample.vibeLabel).toBe('string');
      expect(sample.vibeLabel).toContain(sample.domain.label);
    });

    it('honors fixed user selections over random sampling', () => {
      const sample = sampleVarietyMatrix({ domain: 'work', tone: 'annoyed' });
      expect(sample.domain.id).toBe('work');
      expect(sample.tone.id).toBe('annoyed');
    });

    it('avoids recently used dimensions when sampling without overrides', () => {
      const recent = [
        { domain: { id: 'work' }, tone: { id: 'annoyed' }, format: { id: 'anecdote' }, catalyst: { id: 'misunderstanding' } }
      ];
      // Sample multiple times to verify candidates pool avoids recent when possible
      const samples = Array.from({ length: 10 }, () => sampleVarietyMatrix({}, recent));
      // None of the samples should immediately pick 'work' if other domains exist
      const workPick = samples.find(s => s.domain.id === 'work');
      expect(workPick).toBeUndefined();
    });
  });

  describe('generateStoryFeedbackPrompt', () => {
    it('requests a fluent daily-speaking improved version for the learner translation', () => {
      const prompt = generateStoryFeedbackPrompt('Вчера я ходил в магазин.', storySettings);
      expect(prompt).toContain('Вчера я ходил в магазин.');
      expect(prompt).toMatch(/optimized for daily speaking/i);
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"already_natural"');
      expect(prompt).toContain('"improved_version"');
    });

    it('no longer requests candidate constructions and forbids invented rewrites', () => {
      const prompt = generateStoryFeedbackPrompt('passage', storySettings);
      expect(prompt).not.toMatch(/constructions/i);
      expect(prompt).toContain('NEVER invent a rewrite');
      expect(prompt).toContain('"already_natural"');
    });
  });

  describe('parseStoryFeedback', () => {
    const feedbackJson = (overrides = {}) =>
      JSON.stringify({
        feedback: {
          summary: 'Nice work.',
          already_natural: false,
          improved_version: 'Yesterday I invited a friend over to my place.',
          ...overrides,
        },
      });

    it('parses the summary and the improved version', () => {
      const res = parseStoryFeedback(feedbackJson());
      expect(res.success).toBe(true);
      expect(res.feedback.summary).toBe('Nice work.');
      expect(res.feedback.alreadyNatural).toBe(false);
      expect(res.feedback.improvedVersion).toContain('invited a friend over');
      expect(res.feedback.constructions).toBeUndefined();
    });

    it('extracts feedback from markdown code fences with surrounding prose', () => {
      const wrapped = `Here you go:\n\`\`\`json\n${feedbackJson()}\n\`\`\`\nHope that helps.`;
      const res = parseStoryFeedback(wrapped);
      expect(res.success).toBe(true);
      expect(res.feedback.improvedVersion).toContain('invited a friend over');
    });

    it('affirms an already-natural translation with no invented rewrite', () => {
      const res = parseStoryFeedback(
        feedbackJson({ already_natural: true, improved_version: '' })
      );
      expect(res.success).toBe(true);
      expect(res.feedback.alreadyNatural).toBe(true);
      expect(res.feedback.improvedVersion).toBe('');
    });

    it('derives alreadyNatural from an empty improved version when the flag is omitted', () => {
      const json = JSON.stringify({
        feedback: { summary: 'ok', improved_version: '' },
      });
      const res = parseStoryFeedback(json);
      expect(res.success).toBe(true);
      expect(res.feedback.alreadyNatural).toBe(true);
    });

    it('ignores any constructions a chatty model still returns', () => {
      const res = parseStoryFeedback(
        feedbackJson({
          constructions: [
            {
              construction: 'invite over',
              original: 'x',
              improved: 'y',
              explanation: 'z',
              category: 'syntax',
              spoken_frequency: 'rare',
            },
          ],
        })
      );
      expect(res.success).toBe(true);
      expect(res.feedback.constructions).toBeUndefined();
    });

    it('rejects empty, non-JSON, and missing-feedback responses', () => {
      expect(parseStoryFeedback('').success).toBe(false);
      expect(parseStoryFeedback(null).success).toBe(false);
      expect(parseStoryFeedback('plain prose with no JSON').success).toBe(false);
      expect(parseStoryFeedback(JSON.stringify({ note: 'no feedback key' })).success).toBe(false);
    });
  });

  describe('generateConstructionExtractionPrompt', () => {
    const extractionSettings = { level: 'intermediate' };

    it('carries the selected phrase and the block it came from', () => {
      const prompt = generateConstructionExtractionPrompt(
        'invited him over',
        'Yesterday I invited him over to my place.',
        '',
        extractionSettings
      );
      expect(prompt).toContain('invited him over');
      expect(prompt).toContain('Yesterday I invited him over to my place.');
    });

    it('requests exactly one construction in the vault shape with an empty original', () => {
      const prompt = generateConstructionExtractionPrompt('invited him over', 'source', '', extractionSettings);
      expect(prompt).toMatch(/exactly ONE reusable construction/i);
      expect(prompt).toContain('"improved"');
      expect(prompt).toMatch(/complete, natural spoken English sentence in context/i);
      expect(prompt).toContain('"explanation"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"spoken_frequency"');
      expect(prompt).toMatch(/empty string/i);
    });

    it('requires a short single-clause pattern with a long counter-example', () => {
      const prompt = generateConstructionExtractionPrompt('x', 'y', '', extractionSettings);
      expect(prompt).toMatch(/2-7 words/i);
      expect(prompt).toMatch(/single clause/i);
      expect(prompt).toContain('start taking [class] to [purpose]');
      expect(prompt).toContain("If I wake up at [time], I feel [adjective] and like I haven't had enough sleep");
      expect(prompt).toMatch(/TOO LONG/i);
    });

    it('includes the learner level and the Russian passage when given', () => {
      const prompt = generateConstructionExtractionPrompt(
        'invited him over',
        'source text',
        'Вчера я пригласил друга в гости.',
        { level: 'advanced' }
      );
      expect(prompt).toContain('advanced');
      expect(prompt).toContain('Вчера я пригласил друга в гости.');
    });

    it('omits the passage block when no passage is given', () => {
      const prompt = generateConstructionExtractionPrompt('x', 'y', '', extractionSettings);
      expect(prompt).not.toMatch(/Russian passage/i);
    });
  });

  describe('parseExtractedConstruction', () => {
    const extractionJson = (overrides = {}) =>
      JSON.stringify({
        extraction: {
          construction: 'invite [someone] over',
          original: 'invited him to my home',
          improved: 'invited him over',
          explanation: '"over" is the natural spoken choice.',
          category: 'collocation',
          spoken_frequency: 'very_high',
          ...overrides,
        },
      });

    it('parses one construction in the vault shape with an empty original', () => {
      const res = parseExtractedConstruction(extractionJson());
      expect(res.success).toBe(true);
      expect(res.construction).toMatchObject({
        construction: 'invite [someone] over',
        original: '',
        improved: 'invited him over',
        explanation: '"over" is the natural spoken choice.',
        category: 'collocation',
        spoken_frequency: 'very_high',
      });
    });

    it('normalizes an invented category and frequency with warnings', () => {
      const res = parseExtractedConstruction(
        extractionJson({ category: 'syntax', spoken_frequency: 'rare' })
      );
      expect(res.success).toBe(true);
      expect(res.construction.category).toBe('collocation');
      expect(res.construction.spoken_frequency).toBe('medium');
      expect(res.warnings.length).toBeGreaterThan(0);
    });

    it('defaults a missing category and frequency without warnings', () => {
      const res = parseExtractedConstruction(
        extractionJson({ category: undefined, spoken_frequency: undefined })
      );
      expect(res.success).toBe(true);
      expect(res.construction.category).toBe('collocation');
      expect(res.construction.spoken_frequency).toBe('medium');
      expect(res.warnings).toBeUndefined();
    });

    it('extracts the object from markdown code fences with surrounding prose', () => {
      const wrapped = `Here you go:\n\`\`\`json\n${extractionJson()}\n\`\`\`\nHope that helps.`;
      const res = parseExtractedConstruction(wrapped);
      expect(res.success).toBe(true);
      expect(res.construction.construction).toBe('invite [someone] over');
    });

    it('rejects a response without a construction pattern', () => {
      const res = parseExtractedConstruction(extractionJson({ construction: '   ' }));
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/construction pattern/i);
    });

    it('rejects a response without an improved example', () => {
      const res = parseExtractedConstruction(extractionJson({ improved: undefined }));
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/improved example/i);
    });

    it('rejects empty, non-JSON, and missing-extraction responses', () => {
      expect(parseExtractedConstruction('').success).toBe(false);
      expect(parseExtractedConstruction(null).success).toBe(false);
      expect(parseExtractedConstruction('plain prose with no JSON').success).toBe(false);
      expect(parseExtractedConstruction(JSON.stringify({ note: 'nope' })).success).toBe(false);
    });
  });

  describe('Frequency Drill Prompts and Parsers', () => {
    it('generateFrequencyDrillPrompt constructs proper prompt with sentence and settings', () => {
      const prompt = generateFrequencyDrillPrompt(
        { ru: 'Подожди меня здесь.', en: 'Wait for me here.', previousDrills: [{ ru: 'Стой тут.', en: 'Stand here.' }] },
        { formality: 'conversational', level: 'upper-intermediate' }
      );
      expect(prompt).toContain('Подожди меня здесь.');
      expect(prompt).toContain('Wait for me here.');
      expect(prompt).toContain('Previously generated drill examples');
      expect(prompt).toContain('Стой тут.');
      expect(prompt).toContain('conversational');
      expect(prompt).toContain('upper-intermediate');
      expect(prompt).toContain('STRICT KEYWORD & PATTERN LOCK (ZERO DRIFT)');
      expect(prompt).toContain('MANDATORY ENGLISH KEYWORD: The English translation MUST contain "Wait for me here"');
    });

    it('parseFrequencyDrillSentence parses valid JSON drill', () => {
      const rawJson = JSON.stringify({
        ru: 'Позвони мне позже.',
        en: 'Call me later.',
        targetPattern: 'Imperative + temporal adverb',
        hint: 'Use later for future time',
      });
      const res = parseFrequencyDrillSentence(`\`\`\`json\n${rawJson}\n\`\`\``);
      expect(res.success).toBe(true);
      expect(res.drill.ru).toBe('Позвони мне позже.');
      expect(res.drill.en).toBe('Call me later.');
      expect(res.drill.targetPattern).toBe('Imperative + temporal adverb');
    });

    it('parseFrequencyDrillSentence rejects invalid or missing fields', () => {
      expect(parseFrequencyDrillSentence('').success).toBe(false);
      expect(parseFrequencyDrillSentence(JSON.stringify({ ru: 'Привет' })).success).toBe(false);
    });

    it('evaluateFrequencyDrillPrompt constructs proper evaluation prompt for default ru-en', () => {
      const prompt = evaluateFrequencyDrillPrompt({
        targetRu: 'Позвони мне позже.',
        targetEn: 'Call me later.',
        userAttempt: 'Call me after.',
      });
      expect(prompt).toContain('Target Sentence (Russian): "Позвони мне позже."');
      expect(prompt).toContain('Reference Translation (English): "Call me later."');
      expect(prompt).toContain('Learner\'s translation attempt: "Call me after."');
      expect(prompt).toContain('Study direction: ru-en');
      expect(prompt).toContain('CRITICAL EVALUATION RULES');
      expect(prompt).toContain('"isAccurate"');
    });

    it('evaluateFrequencyDrillPrompt anchors to originalCard when provided', () => {
      const prompt = evaluateFrequencyDrillPrompt({
        targetRu: 'Пойдёшь со мной?',
        targetEn: 'Come with me?',
        userAttempt: 'Do you join me?',
        originalCard: { ru: 'Присоединяйтесь ко мне!', en: 'Join me.' },
      });
      expect(prompt).toContain('ORIGINAL ROOT CARD BEING LEARNED:');
      expect(prompt).toContain('- English: "Join me."');
      expect(prompt).toContain('- Russian: "Присоединяйтесь ко мне!"');
      expect(prompt).toContain('Under NO circumstances should you penalize or reject the learner\'s translation for using the vocabulary or construction from this root card!');
    });

    it('evaluateFrequencyDrillPrompt adapts correctly for en-ru direction', () => {
      const prompt = evaluateFrequencyDrillPrompt({
        targetRu: 'Позвони мне позже.',
        targetEn: 'Call me later.',
        userAttempt: 'Позвони мне потом.',
        direction: 'en-ru',
      });
      expect(prompt).toContain('Target Sentence (English): "Call me later."');
      expect(prompt).toContain('Reference Translation (Russian): "Позвони мне позже."');
      expect(prompt).toContain('Learner\'s translation attempt: "Позвони мне потом."');
      expect(prompt).toContain('Study direction: en-ru');
      expect(prompt).toContain('translating from English into Russian');
    });

    it('parseFrequencyDrillEvaluation parses valid evaluation JSON', () => {
      const rawJson = JSON.stringify({
        isAccurate: true,
        verdict: 'natural',
        naturalRewrite: 'Call me later.',
        explanation: 'Very natural phrasing.',
      });
      const res = parseFrequencyDrillEvaluation(rawJson);
      expect(res.success).toBe(true);
      expect(res.evaluation.isAccurate).toBe(true);
      expect(res.evaluation.verdict).toBe('natural');
      expect(res.evaluation.naturalRewrite).toBe('Call me later.');
    });

    it('parseFrequencyDrillEvaluation falls back safely on unallowed verdict', () => {
      const rawJson = JSON.stringify({
        isAccurate: false,
        verdict: 'unknown_score',
        naturalRewrite: 'Call me later.',
      });
      const res = parseFrequencyDrillEvaluation(rawJson);
      expect(res.success).toBe(true);
      expect(res.evaluation.verdict).toBe('acceptable');
    });
  });

  describe('Deep Study (Explain & Practice) Prompts and Parsers', () => {
    it('generateSentenceDeepStudyPrompt constructs structured prompt with Russian and English', () => {
      const prompt = generateSentenceDeepStudyPrompt(
        { ru: 'У меня болит голова.', en: 'I have a headache.' },
        { formality: 'colloquial', level: 'advanced' }
      );
      expect(prompt).toContain('Target Russian: "У меня болит голова."');
      expect(prompt).toContain('Target English: "I have a headache."');
      expect(prompt).toContain('Learner Level: advanced');
      expect(prompt).toContain('Target Formality: colloquial');
      expect(prompt).toContain('STRICT TARGET CONSTRUCTION LOCK (ZERO DRIFT)');
      expect(prompt).toContain('ZERO DRIFT IN EXAMPLES');
      expect(prompt).toContain('NO SYNONYM SUBSTITUTION');
      expect(prompt).toContain('DO NOT simply repeat the original 2-4 word sentence');
      expect(prompt).toContain('"explanation"');
      expect(prompt).toContain('"vocabulary"');
      expect(prompt).toContain('"examples"');
      expect(prompt).toContain('"practice"');
    });

    it('generateSentenceDeepStudyPrompt adapts direction for en-ru practice', () => {
      const prompt = generateSentenceDeepStudyPrompt(
        { ru: 'Том плакал.', en: 'Tom wept.', direction: 'en-ru' },
        { level: 'intermediate' }
      );
      expect(prompt).toContain('Study Direction: en-ru');
      expect(prompt).toContain('"targetLanguage": "ru"');
      expect(prompt).toContain('"direction": "en-ru"');
    });

    it('parseSentenceDeepStudy parses complete deep study payload', () => {
      const rawJson = JSON.stringify({
        explanation: {
          overallMeaning: 'Expresses that the speaker currently suffers from a headache.',
          nuances: 'Literally "at me aches head" (dative/genitive possessive construction).',
          vocabulary: [
            { term: 'болит', role: 'verb', caseOrAspect: 'imperfective present', meaning: 'hurts/aches', note: 'singular' },
            { term: 'голова', role: 'noun', caseOrAspect: 'nominative singular', meaning: 'head', note: 'subject' }
          ],
          usage: { formality: 'neutral', context: 'Medical or everyday conversation' }
        },
        examples: [
          { ru: 'У тебя болит голова?', en: 'Do you have a headache?', contextType: 'Question' },
          { ru: 'У него не болит голова.', en: 'He does not have a headache.', contextType: 'Negation' }
        ],
        practice: {
          translation: {
            prompt: 'Do you have a headache?',
            reference: 'У тебя болит голова?',
            direction: 'en-ru',
            hint: 'Use second person singular'
          },
          cloze: {
            sentenceWithBlank: 'У меня _____ голова.',
            blankTarget: 'болит',
            promptTranslation: 'My head hurts.',
            targetLanguage: 'ru',
            hint: 'present tense of болеть'
          }
        }
      });

      const res = parseSentenceDeepStudy(`\`\`\`json\n${rawJson}\n\`\`\``);
      expect(res.success).toBe(true);
      expect(res.data.explanation.overallMeaning).toContain('Expresses that the speaker');
      expect(res.data.explanation.vocabulary).toHaveLength(2);
      expect(res.data.explanation.vocabulary[0].term).toBe('болит');
      expect(res.data.examples).toHaveLength(2);
      expect(res.data.examples[0].ru).toBe('У тебя болит голова?');
      expect(res.data.practice.translation.direction).toBe('en-ru');
      expect(res.data.practice.cloze.blankTarget).toBe('болит');
    });

    it('parseSentenceDeepStudy rejects empty or invalid payload', () => {
      expect(parseSentenceDeepStudy('').success).toBe(false);
      expect(parseSentenceDeepStudy('not-json').success).toBe(false);
      expect(parseSentenceDeepStudy(JSON.stringify({ explanation: {} })).success).toBe(false);
    });

    it('generateSentenceExampleVariationsPrompt constructs prompt avoiding previous examples and enforcing zero drift', () => {
      const prompt = generateSentenceExampleVariationsPrompt(
        {
          ru: 'Я опоздал.',
          en: 'I am late.',
          direction: 'ru-en',
          existingExamples: [{ ru: 'Он опоздал.', en: 'He was late.' }]
        },
        { formality: 'informal' }
      );
      expect(prompt).toContain('Target Russian: "Я опоздал."');
      expect(prompt).toContain('Target English: "I am late."');
      expect(prompt).toContain('STRICT TARGET CONSTRUCTION LOCK (ZERO DRIFT)');
      expect(prompt).toContain('NO SYNONYM SUBSTITUTION');
      expect(prompt).toContain('Previously generated examples');
      expect(prompt).toContain('Он опоздал.');
    });

    it('parseSentenceExampleVariations parses list of variations', () => {
      const rawJson = JSON.stringify({
        examples: [
          { ru: 'Мы опоздали на поезд.', en: 'We were late for the train.', contextType: 'Past tense' },
          { ru: 'Не опаздывай!', en: 'Don\'t be late!', contextType: 'Imperative negation' }
        ]
      });
      const res = parseSentenceExampleVariations(rawJson);
      expect(res.success).toBe(true);
      expect(res.examples).toHaveLength(2);
      expect(res.examples[0].ru).toBe('Мы опоздали на поезд.');
    });

    it('parseSentenceExampleVariations rejects empty or malformed inputs', () => {
      expect(parseSentenceExampleVariations('').success).toBe(false);
      expect(parseSentenceExampleVariations(JSON.stringify({ examples: [] })).success).toBe(false);
    });

    it('evaluatePracticeExercisePrompt supports cloze exercise evaluation', () => {
      const prompt = evaluatePracticeExercisePrompt({
        exerciseType: 'cloze',
        prompt: 'У меня _____ голова.',
        blankTarget: 'болит',
        reference: 'У меня болит голова.',
        userAttempt: 'болит',
      });
      expect(prompt).toContain('EXERCISE TYPE: Fill-in-the-blank (Cloze)');
      expect(prompt).toContain('Expected target for blank: "болит"');
      expect(prompt).toContain('Learner\'s answer: "болит"');
    });

    it('evaluatePracticeExercisePrompt supports translation exercise evaluation', () => {
      const prompt = evaluatePracticeExercisePrompt({
        exerciseType: 'translation',
        targetRu: 'Как дела?',
        targetEn: 'How are you?',
        prompt: 'Как дела?',
        reference: 'How are you?',
        userAttempt: 'How are you doing?',
        direction: 'ru-en',
      });
      expect(prompt).toContain('EXERCISE TYPE: Translation (Russian → English)');
      expect(prompt).toContain('Learner\'s translation attempt: "How are you doing?"');
    });

    it('parsePracticeExerciseEvaluation parses accurate and inaccurate verdicts', () => {
      const successRes = parsePracticeExerciseEvaluation(
        JSON.stringify({
          isAccurate: true,
          verdict: 'natural',
          naturalRewrite: 'How are things?',
          explanation: 'Very conversational.',
        })
      );
      expect(successRes.success).toBe(true);
      expect(successRes.evaluation.isAccurate).toBe(true);
      expect(successRes.evaluation.verdict).toBe('natural');

      const failRes = parsePracticeExerciseEvaluation(
        JSON.stringify({
          isAccurate: false,
          verdict: 'incorrect',
          naturalRewrite: 'болит',
          explanation: 'Needs 3rd person singular.',
        })
      );
      expect(failRes.success).toBe(true);
      expect(failRes.evaluation.isAccurate).toBe(false);
      expect(failRes.evaluation.verdict).toBe('incorrect');
    });
  });
});



