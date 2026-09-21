import { describe, it, expect } from 'vitest';
import { 
  generateDescriptionPrompt, 
  generateExportPrompt, 
  generatePracticePrompt, 
  generateExamplesPrompt, 
  generateTranslationPracticePrompt,
  parseImportJSON 
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

  it('generateTranslationPracticePrompt formats prompt for multi-round Russian translation practice', () => {
    const imps = [{ construction: 'invite over', improved: 'I invited him over' }];
    const prompt = generateTranslationPracticePrompt(imps, dummySettings);
    expect(prompt).toContain('ROUND 1');
    expect(prompt).toContain('[[Russian phrase|Target English Construction]]');
    expect(prompt).toContain('invite over');
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
});
