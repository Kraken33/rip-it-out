// ── Store: localStorage wrapper for all app data ───────────────────
// Entities: sessions, improvements, srsCards, settings

const STORAGE_KEYS = {
  sessions: 'rio_sessions',
  improvements: 'rio_improvements',
  srsCards: 'rio_srs_cards',
  settings: 'rio_settings',
};

const DEFAULT_SETTINGS = {
  formality: 'casual',       // casual | neutral | semi-formal
  level: 'intermediate',     // beginner | intermediate | advanced
  focusArea: 'all',          // all | vocabulary | grammar | collocations | idioms
  maxImprovements: 5,        // 3 | 5
  practiceMode: 'flashcard', // flashcard | conversation
};

// ── Helpers ────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Sessions ───────────────────────────────────────────────────────

export function getSessions() {
  return readStore(STORAGE_KEYS.sessions) || [];
}

export function getSession(id) {
  return getSessions().find((s) => s.id === id) || null;
}

export function createSession({ title, sourceType, tags = [], notes = '' }) {
  const session = {
    id: generateId(),
    title,
    sourceType,
    tags,
    notes,
    createdAt: new Date().toISOString(),
    status: 'created', // created | prompted | imported
  };
  const sessions = getSessions();
  sessions.unshift(session);
  writeStore(STORAGE_KEYS.sessions, sessions);
  return session;
}

export function updateSession(id, updates) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  writeStore(STORAGE_KEYS.sessions, sessions);
  return sessions[idx];
}

export function deleteSession(id) {
  // Cascade: delete improvements and SRS cards
  const improvements = getImprovementsBySession(id);
  improvements.forEach((imp) => deleteSrsCard(imp.id));
  const allImprovements = getImprovements().filter((i) => i.sessionId !== id);
  writeStore(STORAGE_KEYS.improvements, allImprovements);
  const sessions = getSessions().filter((s) => s.id !== id);
  writeStore(STORAGE_KEYS.sessions, sessions);
}

// ── Improvements ───────────────────────────────────────────────────

export function getImprovements() {
  return readStore(STORAGE_KEYS.improvements) || [];
}

export function getImprovement(id) {
  return getImprovements().find((i) => i.id === id) || null;
}

export function getImprovementsBySession(sessionId) {
  return getImprovements().filter((i) => i.sessionId === sessionId);
}

export function addImprovements(sessionId, items) {
  const improvements = getImprovements();
  const newItems = items.map((item) => ({
    id: generateId(),
    sessionId,
    original: item.original,
    improved: item.improved,
    explanation: item.explanation,
    category: normalizeCategory(item.category),
    spokenFrequency: normalizeFrequency(item.spoken_frequency || item.spokenFrequency),
    createdAt: new Date().toISOString(),
  }));

  improvements.unshift(...newItems);
  writeStore(STORAGE_KEYS.improvements, improvements);

  // Create SRS cards for each new improvement
  newItems.forEach((imp) => createSrsCard(imp.id));

  // Update session status
  updateSession(sessionId, { status: 'imported' });

  return newItems;
}

export function deleteImprovement(id) {
  deleteSrsCard(id);
  const improvements = getImprovements().filter((i) => i.id !== id);
  writeStore(STORAGE_KEYS.improvements, improvements);
}

function normalizeCategory(cat) {
  if (!cat) return 'grammar';
  const map = {
    vocab: 'vocabulary',
    'grammar/tense': 'grammar',
    'grammar/article': 'grammar',
    tense: 'grammar',
    phrase: 'collocation',
    phrases: 'collocation',
    expression: 'idiom',
  };
  const lower = cat.toLowerCase().trim();
  return map[lower] || (['grammar', 'vocabulary', 'collocation', 'idiom', 'pronunciation', 'structure'].includes(lower) ? lower : 'grammar');
}

function normalizeFrequency(freq) {
  if (!freq) return 'high';
  const lower = freq.toLowerCase().trim().replace(' ', '_');
  return ['very_high', 'high', 'medium'].includes(lower) ? lower : 'high';
}

// ── Duplicate detection ────────────────────────────────────────────

export function findDuplicate(originalText) {
  const normalized = originalText.toLowerCase().trim();
  return getImprovements().find(
    (i) => i.original.toLowerCase().trim() === normalized
  );
}

// ── SRS Cards ──────────────────────────────────────────────────────

export function getSrsCards() {
  return readStore(STORAGE_KEYS.srsCards) || [];
}

export function getSrsCard(improvementId) {
  return getSrsCards().find((c) => c.improvementId === improvementId) || null;
}

function createSrsCard(improvementId) {
  const cards = getSrsCards();
  cards.push({
    improvementId,
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    totalReviews: 0,
    lapses: 0,
  });
  writeStore(STORAGE_KEYS.srsCards, cards);
}

function deleteSrsCard(improvementId) {
  const cards = getSrsCards().filter((c) => c.improvementId !== improvementId);
  writeStore(STORAGE_KEYS.srsCards, cards);
}

export function updateSrsCard(improvementId, updates) {
  const cards = getSrsCards();
  const idx = cards.findIndex((c) => c.improvementId === improvementId);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...updates };
  writeStore(STORAGE_KEYS.srsCards, cards);
  return cards[idx];
}

export function resetSrsCard(improvementId) {
  return updateSrsCard(improvementId, {
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    totalReviews: 0,
    lapses: 0,
  });
}

export function getDueCards() {
  const now = new Date();
  const cards = getSrsCards().filter((c) => new Date(c.nextReview) <= now);

  // Sort: lapsed first, then new, then reviews (most overdue first)
  return cards.sort((a, b) => {
    const priorityMap = { learning: 0, new: 1, reviewing: 2, mature: 3 };
    const pa = a.lapses > 0 && a.status === 'learning' ? -1 : (priorityMap[a.status] ?? 2);
    const pb = b.lapses > 0 && b.status === 'learning' ? -1 : (priorityMap[b.status] ?? 2);
    if (pa !== pb) return pa - pb;
    return new Date(a.nextReview) - new Date(b.nextReview);
  });
}

// ── Settings ───────────────────────────────────────────────────────

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(readStore(STORAGE_KEYS.settings) || {}) };
}

export function updateSettings(updates) {
  const settings = getSettings();
  const merged = { ...settings, ...updates };
  writeStore(STORAGE_KEYS.settings, merged);
  return merged;
}

// ── Stats ──────────────────────────────────────────────────────────

export function getStats() {
  const improvements = getImprovements();
  const cards = getSrsCards();
  const dueCards = getDueCards();

  const mature = cards.filter((c) => c.status === 'mature').length;
  const newCards = cards.filter((c) => c.status === 'new').length;

  // Calculate streak
  const reviewDates = cards
    .filter((c) => c.lastReview)
    .map((c) => {
      const d = new Date(c.lastReview);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
  const uniqueDates = [...new Set(reviewDates)].sort().reverse();

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = `${expected.getFullYear()}-${expected.getMonth()}-${expected.getDate()}`;
    if (uniqueDates.includes(expectedKey)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalImprovements: improvements.length,
    totalSessions: getSessions().length,
    dueToday: dueCards.length,
    newCards,
    mature,
    streak,
    masteryPercent: improvements.length > 0 ? Math.round((mature / improvements.length) * 100) : 0,
  };
}

// ── Export / Import ────────────────────────────────────────────────

export function exportAllData() {
  return {
    app: 'rip-it-out',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    sessions: getSessions(),
    improvements: getImprovements(),
    srsCards: getSrsCards(),
  };
}

export function importData(data, mode = 'merge') {
  if (data.app !== 'rip-it-out') throw new Error('Invalid export file');

  if (mode === 'replace') {
    writeStore(STORAGE_KEYS.sessions, data.sessions || []);
    writeStore(STORAGE_KEYS.improvements, data.improvements || []);
    writeStore(STORAGE_KEYS.srsCards, data.srsCards || []);
    if (data.settings) writeStore(STORAGE_KEYS.settings, data.settings);
    return;
  }

  // Merge mode: add items with new IDs that don't exist yet
  if (data.sessions) {
    const existing = getSessions();
    const existingIds = new Set(existing.map((s) => s.id));
    const newItems = data.sessions.filter((s) => !existingIds.has(s.id));
    writeStore(STORAGE_KEYS.sessions, [...existing, ...newItems]);
  }

  if (data.improvements) {
    const existing = getImprovements();
    const existingIds = new Set(existing.map((i) => i.id));
    const newItems = data.improvements.filter((i) => !existingIds.has(i.id));
    writeStore(STORAGE_KEYS.improvements, [...existing, ...newItems]);
  }

  if (data.srsCards) {
    const existing = getSrsCards();
    const existingIds = new Set(existing.map((c) => c.improvementId));
    const newItems = data.srsCards.filter((c) => !existingIds.has(c.improvementId));
    writeStore(STORAGE_KEYS.srsCards, [...existing, ...newItems]);
  }
}

export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
