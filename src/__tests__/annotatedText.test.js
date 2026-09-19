import { describe, it, expect } from 'vitest';
import { buildAnnotatedText } from '../textAnnotator';

describe('buildAnnotatedText', () => {
  it('handles empty input gracefully', () => {
    expect(buildAnnotatedText('', [])).toEqual({
      segments: [],
      matchedCount: 0,
      unmatchedCount: 0,
    });
  });

  it('correctly segments text with matching improvements', () => {
    const rawText = 'I invited him to my home and we discussed about the topic.';
    const improvements = [
      {
        original: 'invited him to my home',
        improved: 'invited him over to my place',
        explanation: 'More natural spoken phrasing.',
      },
      {
        original: 'discussed about',
        improved: 'discussed',
        explanation: 'Discuss does not take prepositions.',
      },
    ];

    const result = buildAnnotatedText(rawText, improvements);
    expect(result.matchedCount).toBe(2);
    expect(result.unmatchedCount).toBe(0);

    expect(result.segments).toHaveLength(5);
    expect(result.segments[0]).toEqual({ type: 'text', content: 'I ' });
    expect(result.segments[1]).toEqual({
      type: 'correction',
      original: 'invited him to my home',
      improved: 'invited him over to my place',
      explanation: 'More natural spoken phrasing.',
      construction: undefined,
    });
    expect(result.segments[2]).toEqual({ type: 'text', content: ' and we ' });
    expect(result.segments[3]).toEqual({
      type: 'correction',
      original: 'discussed about',
      improved: 'discussed',
      explanation: 'Discuss does not take prepositions.',
      construction: undefined,
    });
    expect(result.segments[4]).toEqual({ type: 'text', content: ' the topic.' });
  });

  it('tracks unmatched improvements when text does not contain original phrase', () => {
    const rawText = 'I went to the store today.';
    const improvements = [
      {
        original: 'invited him to my home',
        improved: 'invited him over',
        explanation: 'Sample',
      },
    ];

    const result = buildAnnotatedText(rawText, improvements);
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedCount).toBe(1);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({ type: 'text', content: 'I went to the store today.' });
  });
});
