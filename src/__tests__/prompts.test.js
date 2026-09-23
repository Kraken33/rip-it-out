import { describe, it, expect } from 'vitest';
import { 
  generateDescriptionPrompt, 
  generateExportPrompt, 
  generatePracticePrompt, 
  generateExamplesPrompt, 
  generateTranslationPracticePrompt,
  generateStoryPassagePrompt,
  generateStoryFeedbackPrompt,
  parseImportJSON,
  parseTranslationVerdict,
  parseStoryFeedback,
  STORY_ROUND_CONSTRUCTION_CAP
} from '../prompts';

describe('Prompt Orchestrator & Parser', () => {
  const dummySession = { title: 'Atomic Habits', sourceType: 'book' };
  const dummySettings = { maxImprovements: 5, formality: 'casual', level: 'intermediate', focusArea: 'all' };

  it('generateDescriptionPrompt includes 3 follow-up questions, construction extraction, and article exclusion', () => {
    const prompt = generateDescriptionPrompt(dummySession, dummySettings);
    expect(prompt).toContain('STEP 2: ASK ME 3 FOLLOW-UP QUESTIONS');
    expect(prompt).toContain('construction/pattern');
    expect(prompt).toContain('Ignore missing or incorrect articles (a, an, the)');
    expect(prompt).toContain('Atomic Habits');
  });

  it('generateExportPrompt requests JSON with construction field across whole conversation', () => {
    const prompt = generateExportPrompt();
    expect(prompt).toContain('"construction"');
    expect(prompt).toContain('WHOLE conversation');
  });

  it('generateDescriptionPrompt requires short single-clause construction patterns', () => {
    const prompt = generateDescriptionPrompt(dummySession, dummySettings);
    expect(prompt).toMatch(/2-7 words/i);
    expect(prompt).toMatch(/single clause/i);
    expect(prompt).toContain('start taking [class] to [purpose]');
    expect(prompt).toContain("If I wake up at [time], I feel [adjective] and like I haven't had enough sleep");
    expect(prompt).toMatch(/TOO LONG/i);
  });

  it('generateExportPrompt requires short single-clause construction patterns', () => {
    const prompt = generateExportPrompt();
    expect(prompt).toMatch(/2-7 words/i);
    expect(prompt).toMatch(/single clause/i);
    expect(prompt).toContain('start taking [class] to [purpose]');
    expect(prompt).toContain("If I wake up at [time], I feel [adjective] and like I haven't had enough sleep");
  });

  it('generatePracticePrompt generates 5 Russian scenario questions for English target constructions', () => {
    const imps = [{ construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over to my place' }];
    const prompt = generatePracticePrompt(imps, dummySettings);
    expect(prompt).toContain('RUSSIAN (на русском языке)');
    expect(prompt).toContain('invite [someone] over');
  });

  it('generateExamplesPrompt requests casual short sentences for constructions', () => {
    const imps = [{ construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over', explanation: 'natural' }];
    const prompt = generateExamplesPrompt(imps);
    expect(prompt).toContain('Construction: "invite [someone] over"');
  });

  it('generateTranslationPracticePrompt formats prompt for unlimited two-per-round Russian translation practice', () => {
    const imps = [{ construction: 'invite over', improved: 'I invited him over' }];
    const prompt = generateTranslationPracticePrompt(imps, dummySettings);
    expect(prompt).toContain('ROUND 1');
    expect(prompt).toContain('[[Russian phrase|Target English Construction]]');
    expect(prompt).toContain('invite over');
    expect(prompt).toMatch(/exactly 2 target constructions per round/i);
    expect(prompt).toMatch(/NEXT ROUND/i);
    expect(prompt).toMatch(/FINISH/i);
    expect(prompt).not.toMatch(/4 to 5/i);
    expect(prompt).not.toMatch(/3 to 5 constructions per round/i);
  });

  describe('parseImportJSON', () => {
    it('returns error for empty input', () => {
      const res = parseImportJSON('');
      expect(res.success).toBe(false);
    });

    it('parses raw JSON string correctly', () => {
      const json = JSON.stringify({
        improvements: [
          {
            construction: 'invite [someone] over',
            original: 'invited him home',
            improved: 'invited him over',
            explanation: 'sounds natural',
            category: 'grammar',
            spoken_frequency: 'high'
          }
        ]
      });
      const res = parseImportJSON(json);
      expect(res.success).toBe(true);
      expect(res.improvements).toHaveLength(1);
      expect(res.improvements[0].construction).toBe('invite [someone] over');
    });

    it('extracts JSON from markdown code fences', () => {
      const markdown = `Here is your JSON:
\`\`\`json
{
  "improvements": [
    {
      "original": "old",
      "improved": "new",
      "explanation": "why"
    }
  ]
}
\`\`\`
Hope this helps!`;
      const res = parseImportJSON(markdown);
      expect(res.success).toBe(true);
      expect(res.improvements[0].construction).toBe('new'); // Fallback to improved
    });

    it('sanitizes meta explanation titles in construction field to improved phrase', () => {
      const json = JSON.stringify({
        improvements: [
          {
            construction: "Duplicate 'just' usage",
            original: 'I just updated my app so I want just to test',
            improved: 'I just updated my app, so I want to test',
            explanation: 'Removing the second just makes it smoother',
            category: 'grammar',
            spoken_frequency: 'high',
          },
        ],
      });
      const res = parseImportJSON(json);
      expect(res.success).toBe(true);
      expect(res.improvements[0].construction).toBe('I just updated my app, so I want to test');
    });

    it('handles missing required fields by skipping invalid items', () => {
      const json = JSON.stringify({
        improvements: [
          { original: 'old' }, // missing improved & explanation
          { original: 'a', improved: 'b', explanation: 'c' }
        ]
      });
      const res = parseImportJSON(json);
      expect(res.success).toBe(true);
      expect(res.improvements).toHaveLength(1);
      expect(res.skipped).toBe(1);
    });
  });

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
  const storySession = { title: 'Weekend in the Countryside', sourceType: 'other' };
  const storySettings = { formality: 'casual', level: 'intermediate', maxImprovements: 5 };

  describe('generateStoryPassagePrompt', () => {
    it('grounds the story in the session topic and learner level, requesting only Russian text', () => {
      const prompt = generateStoryPassagePrompt(storySession, storySettings);
      expect(prompt).toContain('Weekend in the Countryside');
      expect(prompt).toContain('intermediate');
      expect(prompt).toMatch(/ONE short natural Russian story/i);
      expect(prompt).toMatch(/ONLY the Russian story text/i);
      expect(prompt).toMatch(/No title, no English translation, no commentary/i);
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
    });

    it('omits the demands block and keeps the everyday-topic fallback when none are given', () => {
      const prompt = generateStoryPassagePrompt({ title: '', storyDemands: '' }, storySettings);
      expect(prompt).not.toMatch(/specifically asked to practice/i);
      expect(prompt).toContain('everyday life');
    });
  });

  describe('generateStoryFeedbackPrompt', () => {
    it('requests a fluent daily-speaking improved version in the vault improvement shape', () => {
      const prompt = generateStoryFeedbackPrompt('Вчера я ходил в магазин.', storySettings);
      expect(prompt).toContain('Вчера я ходил в магазин.');
      expect(prompt).toMatch(/optimized for daily speaking/i);
      expect(prompt).toContain('"construction"');
      expect(prompt).toContain('"original"');
      expect(prompt).toContain('"improved"');
      expect(prompt).toContain('"explanation"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"spoken_frequency"');
    });

    it('caps constructions per round and forbids invented rewrites for correct translations', () => {
      const prompt = generateStoryFeedbackPrompt('passage', storySettings);
      expect(prompt).toContain(`up to ${STORY_ROUND_CONSTRUCTION_CAP}`);
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
          constructions: [
            {
              construction: 'invite [someone] over',
              original: 'invited a friend to my house',
              improved: 'invited a friend over',
              explanation: '"over" is the natural spoken choice.',
              category: 'collocation',
              spoken_frequency: 'very_high',
            },
          ],
          ...overrides,
        },
      });

    it('parses improved version and constructions in the vault shape', () => {
      const res = parseStoryFeedback(feedbackJson());
      expect(res.success).toBe(true);
      expect(res.feedback.alreadyNatural).toBe(false);
      expect(res.feedback.improvedVersion).toContain('invited a friend over');
      expect(res.feedback.constructions).toHaveLength(1);
      expect(res.feedback.constructions[0]).toMatchObject({
        construction: 'invite [someone] over',
        original: 'invited a friend to my house',
        improved: 'invited a friend over',
        category: 'collocation',
        spoken_frequency: 'very_high',
      });
    });

    it('extracts feedback from markdown code fences with surrounding prose', () => {
      const wrapped = `Here you go:\n\`\`\`json\n${feedbackJson()}\n\`\`\`\nHope that helps.`;
      const res = parseStoryFeedback(wrapped);
      expect(res.success).toBe(true);
      expect(res.feedback.constructions).toHaveLength(1);
    });

    it('affirms an already-natural translation with no invented rewrite but keeps candidate constructions', () => {
      const res = parseStoryFeedback(
        feedbackJson({ already_natural: true, improved_version: '' })
      );
      expect(res.success).toBe(true);
      expect(res.feedback.alreadyNatural).toBe(true);
      expect(res.feedback.improvedVersion).toBe('');
      expect(res.feedback.constructions).toHaveLength(1);
    });

    it('derives alreadyNatural from an empty improved version when the flag is omitted', () => {
      const json = JSON.stringify({
        feedback: { summary: 'ok', improved_version: '', constructions: [] },
      });
      const res = parseStoryFeedback(json);
      expect(res.success).toBe(true);
      expect(res.feedback.alreadyNatural).toBe(true);
    });

    it('caps constructions at the per-round limit', () => {
      const constructions = Array.from({ length: 5 }, (_, i) => ({
        construction: `pattern ${i}`,
        original: `orig ${i}`,
        improved: `imp ${i}`,
        explanation: 'why',
        category: 'vocabulary',
        spoken_frequency: 'medium',
      }));
      const res = parseStoryFeedback(feedbackJson({ constructions }));
      expect(res.success).toBe(true);
      expect(res.feedback.constructions).toHaveLength(STORY_ROUND_CONSTRUCTION_CAP);
      expect(res.warnings.some((w) => /Capped constructions/.test(w))).toBe(true);
    });

    it('normalizes invalid category and frequency with warnings', () => {
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
      expect(res.feedback.constructions[0].category).toBe('vocabulary');
      expect(res.feedback.constructions[0].spoken_frequency).toBe('medium');
      expect(res.warnings.length).toBeGreaterThan(0);
    });

    it('rejects empty, non-JSON, and missing-feedback responses', () => {
      expect(parseStoryFeedback('').success).toBe(false);
      expect(parseStoryFeedback(null).success).toBe(false);
      expect(parseStoryFeedback('plain prose with no JSON').success).toBe(false);
      expect(parseStoryFeedback(JSON.stringify({ note: 'no feedback key' })).success).toBe(false);
    });

    it('rejects a non-list constructions value', () => {
      const res = parseStoryFeedback(feedbackJson({ constructions: 'nope' }));
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/constructions/);
    });
  });
});


