/**
 * Service for streaming and parsing bilingual English-Russian sentences
 * from manythings.org / Tatoeba project dynamically in the browser.
 */

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Parse an array of tab-delimited strings from manythings.org (window.sent).
 *
 * Example line:
 * "1159202\t2877272\tМарш!\tshanghainese\tGo.\tCM\t1"
 *
 * @param {string[]} lines - Raw lines from window.sent
 * @param {number} [pageNumber=1] - Page number for tracking
 * @returns {Array<{ id: string, enId: string, ruId: string, en: string, ru: string, page: number }>}
 */
export function parseManythingsRawLines(lines, pageNumber = 1) {
  if (!Array.isArray(lines)) return [];

  const seenEn = new Set();
  const seenRu = new Set();
  const results = [];

  for (const rawLine of lines) {
    if (!rawLine || typeof rawLine !== 'string') continue;
    const parts = rawLine.split('\t');
    if (parts.length < 5) continue;

    const ruId = parts[0]?.trim() || '';
    const enId = parts[1]?.trim() || '';
    const ruText = parts[2]?.trim() || '';
    const enText = parts[4]?.trim() || '';

    if (!ruText || !enText) continue;

    // Normalize for 1-to-1 deduplication (ignore case & trailing punctuation for duplicate checks)
    const normalizedEn = enText.toLowerCase().replace(/[.!?]+$/, '');
    const normalizedRu = ruText.toLowerCase().replace(/[.!?]+$/, '');

    if (seenEn.has(normalizedEn) || seenRu.has(normalizedRu)) {
      continue;
    }

    seenEn.add(normalizedEn);
    seenRu.add(normalizedRu);

    results.push({
      id: `${enId}_${ruId}`,
      enId,
      ruId,
      en: enText,
      ru: ruText,
      page: Number(pageNumber),
    });
  }

  return results;
}

/**
 * Dynamically stream a Manythings page using script-tag injection to bypass CORS.
 *
 * @param {number|string} pageNumber - Page index (1-based)
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=10000]
 * @param {Document} [options.documentRef=document]
 * @param {Window} [options.windowRef=window]
 * @returns {Promise<Array<{ id: string, enId: string, ruId: string, en: string, ru: string, page: number }>>}
 */
export function fetchManythingsPage(pageNumber, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    documentRef = typeof document !== 'undefined' ? document : null,
    windowRef = typeof window !== 'undefined' ? window : null,
  } = options;

  const page = parseInt(pageNumber, 10);
  if (isNaN(page) || page < 1) {
    return Promise.reject(new Error('Invalid page number: must be an integer >= 1.'));
  }

  if (!documentRef || !documentRef.createElement) {
    return Promise.reject(new Error('DOM document is required for dynamic script injection.'));
  }

  return new Promise((resolve, reject) => {
    let timer = null;
    let finished = false;

    // Clean up any lingering window.sent before loading
    if (windowRef) {
      try {
        delete windowRef.sent;
      } catch {
        windowRef.sent = undefined;
      }
    }

    const script = documentRef.createElement('script');
    script.src = `https://www.manythings.org/bilingual/rus/${page}.js`;
    script.async = true;

    function cleanup() {
      if (timer) clearTimeout(timer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (windowRef) {
        try {
          delete windowRef.sent;
        } catch {
          windowRef.sent = undefined;
        }
      }
    }

    script.onload = () => {
      if (finished) return;
      finished = true;

      const rawSentences = windowRef?.sent;
      if (!Array.isArray(rawSentences)) {
        cleanup();
        reject(new Error(`Failed to load sentences: page ${page} payload was empty or invalid.`));
        return;
      }

      const parsed = parseManythingsRawLines(rawSentences, page);
      cleanup();
      resolve(parsed);
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(`Network error: could not load Manythings page ${page}. Please check your connection.`));
    };

    timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(`Timeout: loading Manythings page ${page} took longer than ${timeoutMs}ms.`));
    }, timeoutMs);

    const target = documentRef.head || documentRef.body || documentRef.documentElement;
    target.appendChild(script);
  });
}
