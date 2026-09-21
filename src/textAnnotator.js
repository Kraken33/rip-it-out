/**
 * Segments rawText into plain text and inline corrections matching improvement.original
 *
 * @param {string} rawText - User's pasted conversation text
 * @param {Array} improvements - Array of improvement objects [{ original, improved, explanation }]
 * @returns {{ segments: Array, matchedCount: number, unmatchedCount: number }}
 */
export function buildAnnotatedText(rawText, improvements = []) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return { segments: [], matchedCount: 0, unmatchedCount: improvements.length };
  }

  if (!improvements || !Array.isArray(improvements) || improvements.length === 0) {
    return {
      segments: [{ type: 'text', content: rawText }],
      matchedCount: 0,
      unmatchedCount: 0,
    };
  }

  const lowerRaw = rawText.toLowerCase();
  const matches = [];
  const unmatched = [];

  // Find position of each improvement's original text
  improvements.forEach((imp) => {
    if (!imp.original || typeof imp.original !== 'string') {
      unmatched.push(imp);
      return;
    }
    const idx = lowerRaw.indexOf(imp.original.toLowerCase().trim());
    if (idx !== -1) {
      matches.push({
        index: idx,
        length: imp.original.trim().length,
        original: rawText.slice(idx, idx + imp.original.trim().length),
        improved: imp.improved,
        explanation: imp.explanation,
        construction: imp.construction,
      });
    } else {
      unmatched.push(imp);
    }
  });

  // Sort matches by starting index
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches
  const nonOverlapping = [];
  let lastEnd = 0;
  matches.forEach((m) => {
    if (m.index >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.index + m.length;
    } else {
      unmatched.push(m);
    }
  });

  const segments = [];
  let cursor = 0;

  nonOverlapping.forEach((m) => {
    if (m.index > cursor) {
      segments.push({
        type: 'text',
        content: rawText.slice(cursor, m.index),
      });
    }
    segments.push({
      type: 'correction',
      original: m.original,
      improved: m.improved,
      explanation: m.explanation,
      construction: m.construction,
    });
    cursor = m.index + m.length;
  });

  if (cursor < rawText.length) {
    segments.push({
      type: 'text',
      content: rawText.slice(cursor),
    });
  }

  return {
    segments,
    matchedCount: nonOverlapping.length,
    unmatchedCount: improvements.length - nonOverlapping.length,
  };
}

/**
 * Parses a Russian text passage containing tagged target constructions:
 * e.g., "Вчера я [[пригласил друга в гости|invite over]], но он отказался."
 *
 * @param {string} text
 * @returns {Array<{ text: string, isHighlight: boolean, target?: string }>}
 */
export function parseTaggedPassage(text) {
  if (!text || typeof text !== 'string') return [];

  const segments = [];
  const regex = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isHighlight: false,
      });
    }

    const ruText = (match[1] || '').trim();
    const targetEn = (match[2] || '').trim();

    segments.push({
      text: ruText,
      isHighlight: true,
      target: targetEn || undefined,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    });
  }

  return segments;
}
