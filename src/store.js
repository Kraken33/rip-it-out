import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  topics: 'rio_topics',
  sessions: 'rio_sessions',
  improvements: 'rio_improvements',
  srsCards: 'rio_srs_cards',
  settings: 'rio_settings',
  activityLogs: 'rio_activity_logs',
};

const DEFAULT_SETTINGS = {
  formality: 'casual',
  level: 'intermediate',
  focusArea: 'all',
  maxImprovements: 5,
  practiceMode: 'flashcard',
  groqApiKey: '',
  groqModel: 'openai/gpt-oss-20b',
  openaiApiKey: '',
  ttsEngine: 'browser',
  ttsVoice: 'alloy',
  defaultMode: 'seamless',
};

// ── Helpers ────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readLocalStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing localStorage:', err);
  }
}

// ── Data Mappers ───────────────────────────────────────────────────

function mapTopicFromDb(r) {
  if (!r) return null;
  return { id: r.id, title: r.title, createdAt: r.created_at, sessionIds: r.session_ids || [] };
}
function mapTopicToDb(t) {
  return { id: t.id, title: t.title, created_at: t.createdAt, session_ids: t.sessionIds || [] };
}

function mapSessionFromDb(r) {
  if (!r) return null;
  return {
    id: r.id,
    topicId: r.topic_id,
    title: r.title,
    sourceType: r.source_type,
    tags: r.tags || [],
    notes: r.notes || '',
    durationSeconds: r.duration_seconds || 0,
    rawText: r.raw_text || null,
    createdAt: r.created_at,
    status: r.status || 'created',
  };
}
function mapSessionToDb(s) {
  return {
    id: s.id,
    topic_id: s.topicId,
    title: s.title,
    source_type: s.sourceType,
    tags: s.tags || [],
    notes: s.notes || '',
    duration_seconds: s.durationSeconds || 0,
    raw_text: s.rawText || null,
    created_at: s.createdAt,
    status: s.status || 'created',
  };
}

function mapImprovementFromDb(r) {
  if (!r) return null;
  return {
    id: r.id,
    sessionId: r.session_id,
    construction: r.construction,
    original: r.original,
    improved: r.improved,
    explanation: r.explanation,
    category: r.category,
    spokenFrequency: r.spoken_frequency,
    createdAt: r.created_at,
  };
}
function mapImprovementToDb(i) {
  return {
    id: i.id,
    session_id: i.sessionId,
    construction: i.construction,
    original: i.original,
    improved: i.improved,
    explanation: i.explanation,
    category: i.category,
    spoken_frequency: i.spokenFrequency,
    created_at: i.createdAt,
  };
}

function mapSrsCardFromDb(r) {
  if (!r) return null;
  return {
    improvementId: r.improvement_id,
    status: r.status,
    easeFactor: r.ease_factor,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    nextReview: r.next_review,
    lastReview: r.last_review,
    totalReviews: r.total_reviews,
    lapses: r.lapses,
  };
}
function mapSrsCardToDb(c) {
  return {
    improvement_id: c.improvementId,
    status: c.status,
    ease_factor: c.easeFactor,
    interval_days: c.intervalDays,
    repetitions: c.repetitions,
    next_review: c.nextReview,
    last_review: c.lastReview,
    total_reviews: c.totalReviews,
    lapses: c.lapses,
  };
}

function mapSettingsFromDb(r) {
  if (!r) return DEFAULT_SETTINGS;
  return {
    formality: r.formality || DEFAULT_SETTINGS.formality,
    level: r.level || DEFAULT_SETTINGS.level,
    focusArea: r.focus_area || DEFAULT_SETTINGS.focusArea,
    maxImprovements: r.max_improvements ?? DEFAULT_SETTINGS.maxImprovements,
    practiceMode: r.practice_mode || DEFAULT_SETTINGS.practiceMode,
    groqApiKey: r.groq_api_key ?? DEFAULT_SETTINGS.groqApiKey,
    groqModel: r.groq_model || 'openai/gpt-oss-20b',
    openaiApiKey: r.openai_api_key ?? DEFAULT_SETTINGS.openaiApiKey,
    ttsEngine: r.tts_engine || DEFAULT_SETTINGS.ttsEngine,
    ttsVoice: r.tts_voice || DEFAULT_SETTINGS.ttsVoice,
    defaultMode: r.default_mode || DEFAULT_SETTINGS.defaultMode,
  };
}

function mapActivityLogFromDb(r) {
  if (!r) return null;
  return {
    id: r.id,
    type: r.type,
    durationSeconds: r.duration_seconds,
    sessionId: r.session_id,
    topicId: r.topic_id,
    createdAt: r.created_at,
  };
}
function mapActivityLogToDb(l) {
  return {
    id: l.id,
    type: l.type,
    duration_seconds: l.durationSeconds,
    session_id: l.sessionId,
    topic_id: l.topicId,
    created_at: l.createdAt,
  };
}

// ── Topics ─────────────────────────────────────────────────────────

export async function getTopics() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('topics').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapTopicFromDb);
  }
  return readLocalStore(STORAGE_KEYS.topics) || [];
}

export async function getTopic(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('topics').select('*').eq('id', id).single();
    if (!error && data) return mapTopicFromDb(data);
  }
  const topics = (readLocalStore(STORAGE_KEYS.topics) || []);
  return topics.find((t) => t.id === id) || null;
}

export async function createTopic({ title }) {
  const topic = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    sessionIds: [],
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('topics').insert(mapTopicToDb(topic)).select().single();
    if (!error && data) return mapTopicFromDb(data);
  }

  const topics = readLocalStore(STORAGE_KEYS.topics) || [];
  topics.unshift(topic);
  writeLocalStore(STORAGE_KEYS.topics, topics);
  return topic;
}

export async function getOrCreateTopic(title) {
  const topics = await getTopics();
  const existing = topics.find((t) => t.title === title);
  if (existing) return existing;
  return await createTopic({ title });
}

async function addSessionToTopic(topicId, sessionId) {
  const topic = await getTopic(topicId);
  if (!topic) return;
  if (!topic.sessionIds.includes(sessionId)) {
    const updatedIds = [...topic.sessionIds, sessionId];
    if (isSupabaseConfigured) {
      await supabase.from('topics').update({ session_ids: updatedIds }).eq('id', topicId);
    } else {
      const topics = readLocalStore(STORAGE_KEYS.topics) || [];
      const idx = topics.findIndex((t) => t.id === topicId);
      if (idx !== -1) {
        topics[idx].sessionIds = updatedIds;
        writeLocalStore(STORAGE_KEYS.topics, topics);
      }
    }
  }
}

// ── Sessions ───────────────────────────────────────────────────────

export async function getSessions() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapSessionFromDb);
  }
  return readLocalStore(STORAGE_KEYS.sessions) || [];
}

export async function getSession(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
    if (!error && data) return mapSessionFromDb(data);
  }
  const sessions = readLocalStore(STORAGE_KEYS.sessions) || [];
  return sessions.find((s) => s.id === id) || null;
}

export async function createSession({ title, sourceType, tags = [], notes = '', durationSeconds = 0, rawText = null }) {
  const topic = await getOrCreateTopic(title);
  const session = {
    id: generateId(),
    topicId: topic.id,
    title,
    sourceType,
    tags,
    notes,
    durationSeconds,
    rawText: rawText || null,
    createdAt: new Date().toISOString(),
    status: 'created',
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('sessions').insert(mapSessionToDb(session)).select().single();
    if (!error && data) {
      await addSessionToTopic(topic.id, session.id);
      return mapSessionFromDb(data);
    }
  }

  const sessions = readLocalStore(STORAGE_KEYS.sessions) || [];
  sessions.unshift(session);
  writeLocalStore(STORAGE_KEYS.sessions, sessions);
  await addSessionToTopic(topic.id, session.id);
  return session;
}

export async function updateSession(id, updates) {
  if (isSupabaseConfigured) {
    const dbUpdates = {};
    if ('topicId' in updates) dbUpdates.topic_id = updates.topicId;
    if ('title' in updates) dbUpdates.title = updates.title;
    if ('sourceType' in updates) dbUpdates.source_type = updates.sourceType;
    if ('tags' in updates) dbUpdates.tags = updates.tags;
    if ('notes' in updates) dbUpdates.notes = updates.notes;
    if ('durationSeconds' in updates) dbUpdates.duration_seconds = updates.durationSeconds;
    if ('rawText' in updates) dbUpdates.raw_text = updates.rawText;
    if ('status' in updates) dbUpdates.status = updates.status;

    const { data, error } = await supabase.from('sessions').update(dbUpdates).eq('id', id).select().single();
    if (!error && data) return mapSessionFromDb(data);
  }

  const sessions = readLocalStore(STORAGE_KEYS.sessions) || [];
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  writeLocalStore(STORAGE_KEYS.sessions, sessions);
  return sessions[idx];
}

export async function addSessionText(id, rawText) {
  return await updateSession(id, { rawText: rawText || null });
}

export async function deleteSession(id) {
  if (isSupabaseConfigured) {
    await supabase.from('sessions').delete().eq('id', id);
    return;
  }
  const improvements = await getImprovementsBySession(id);
  for (const imp of improvements) {
    await deleteSrsCard(imp.id);
  }
  const allImprovements = (await getImprovements()).filter((i) => i.sessionId !== id);
  writeLocalStore(STORAGE_KEYS.improvements, allImprovements);
  const sessions = (await getSessions()).filter((s) => s.id !== id);
  writeLocalStore(STORAGE_KEYS.sessions, sessions);
}

// ── Improvements ───────────────────────────────────────────────────

export async function getImprovements() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('improvements').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapImprovementFromDb);
  }
  return readLocalStore(STORAGE_KEYS.improvements) || [];
}

export async function getImprovement(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('improvements').select('*').eq('id', id).single();
    if (!error && data) return mapImprovementFromDb(data);
  }
  const improvements = await getImprovements();
  return improvements.find((i) => i.id === id) || null;
}

export async function getImprovementsBySession(sessionId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('improvements').select('*').eq('session_id', sessionId);
    if (!error && data) return data.map(mapImprovementFromDb);
  }
  const improvements = await getImprovements();
  return improvements.filter((i) => i.sessionId === sessionId);
}

export async function addImprovements(sessionId, items) {
  const newItems = items.map((item) => ({
    id: generateId(),
    sessionId,
    construction: item.construction || item.improved || item.original,
    original: item.original,
    improved: item.improved,
    explanation: item.explanation,
    category: normalizeCategory(item.category),
    spokenFrequency: normalizeFrequency(item.spoken_frequency || item.spokenFrequency),
    createdAt: new Date().toISOString(),
  }));

  if (isSupabaseConfigured) {
    const dbItems = newItems.map(mapImprovementToDb);
    const { data, error } = await supabase.from('improvements').insert(dbItems).select();
    if (!error && data) {
      for (const imp of newItems) {
        await createSrsCard(imp.id);
      }
      await updateSession(sessionId, { status: 'imported' });
      return data.map(mapImprovementFromDb);
    }
  }

  const improvements = readLocalStore(STORAGE_KEYS.improvements) || [];
  improvements.unshift(...newItems);
  writeLocalStore(STORAGE_KEYS.improvements, improvements);

  for (const imp of newItems) {
    await createSrsCard(imp.id);
  }
  await updateSession(sessionId, { status: 'imported' });
  return newItems;
}

export async function deleteImprovement(id) {
  if (isSupabaseConfigured) {
    await supabase.from('improvements').delete().eq('id', id);
    return;
  }
  await deleteSrsCard(id);
  const improvements = (await getImprovements()).filter((i) => i.id !== id);
  writeLocalStore(STORAGE_KEYS.improvements, improvements);
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

export async function findDuplicate(originalText) {
  const normalized = originalText.toLowerCase().trim();
  const improvements = await getImprovements();
  return improvements.find(
    (i) => i.original.toLowerCase().trim() === normalized
  );
}

// ── SRS Cards ──────────────────────────────────────────────────────

export async function getSrsCards() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('srs_cards').select('*');
    if (!error && data) return data.map(mapSrsCardFromDb);
  }
  return readLocalStore(STORAGE_KEYS.srsCards) || [];
}

export async function getSrsCard(improvementId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('srs_cards').select('*').eq('improvement_id', improvementId).single();
    if (!error && data) return mapSrsCardFromDb(data);
  }
  const cards = await getSrsCards();
  return cards.find((c) => c.improvementId === improvementId) || null;
}

async function createSrsCard(improvementId) {
  const card = {
    improvementId,
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: null,
    totalReviews: 0,
    lapses: 0,
  };

  if (isSupabaseConfigured) {
    await supabase.from('srs_cards').insert(mapSrsCardToDb(card));
    return card;
  }

  const cards = readLocalStore(STORAGE_KEYS.srsCards) || [];
  cards.push(card);
  writeLocalStore(STORAGE_KEYS.srsCards, cards);
  return card;
}

async function deleteSrsCard(improvementId) {
  if (isSupabaseConfigured) {
    await supabase.from('srs_cards').delete().eq('improvement_id', improvementId);
    return;
  }
  const cards = (await getSrsCards()).filter((c) => c.improvementId !== improvementId);
  writeLocalStore(STORAGE_KEYS.srsCards, cards);
}

export async function updateSrsCard(improvementId, updates) {
  if (isSupabaseConfigured) {
    const dbUpdates = {};
    if ('status' in updates) dbUpdates.status = updates.status;
    if ('easeFactor' in updates) dbUpdates.ease_factor = updates.easeFactor;
    if ('intervalDays' in updates) dbUpdates.interval_days = updates.intervalDays;
    if ('repetitions' in updates) dbUpdates.repetitions = updates.repetitions;
    if ('nextReview' in updates) dbUpdates.next_review = updates.nextReview;
    if ('lastReview' in updates) dbUpdates.last_review = updates.lastReview;
    if ('totalReviews' in updates) dbUpdates.total_reviews = updates.totalReviews;
    if ('lapses' in updates) dbUpdates.lapses = updates.lapses;

    const { data, error } = await supabase.from('srs_cards').update(dbUpdates).eq('improvement_id', improvementId).select().single();
    if (!error && data) return mapSrsCardFromDb(data);
  }

  const cards = readLocalStore(STORAGE_KEYS.srsCards) || [];
  const idx = cards.findIndex((c) => c.improvementId === improvementId);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...updates };
  writeLocalStore(STORAGE_KEYS.srsCards, cards);
  return cards[idx];
}

export async function resetSrsCard(improvementId) {
  return await updateSrsCard(improvementId, {
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

export async function getDueCards() {
  const now = new Date();
  const cards = await getSrsCards();
  const due = cards.filter((c) => new Date(c.nextReview) <= now);

  return due.sort((a, b) => {
    const priorityMap = { learning: 0, new: 1, reviewing: 2, mature: 3 };
    const pa = a.lapses > 0 && a.status === 'learning' ? -1 : (priorityMap[a.status] ?? 2);
    const pb = b.lapses > 0 && b.status === 'learning' ? -1 : (priorityMap[b.status] ?? 2);
    if (pa !== pb) return pa - pb;
    return new Date(a.nextReview) - new Date(b.nextReview);
  });
}

// ── Settings ───────────────────────────────────────────────────────

export async function getSettings() {
  const localSettings = readLocalStore(STORAGE_KEYS.settings) || {};
  let dbSettings = {};

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
        if (!error && data) {
          dbSettings = mapSettingsFromDb(data);
        }
      }
    } catch (err) {
      console.warn('Supabase getSettings error:', err);
    }
  }

  return { ...DEFAULT_SETTINGS, ...dbSettings, ...localSettings };
}

export async function updateSettings(updates) {
  const current = await getSettings();
  const merged = { ...current, ...updates };

  writeLocalStore(STORAGE_KEYS.settings, merged);

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbRow = {
          user_id: user.id,
          formality: merged.formality,
          level: merged.level,
          focus_area: merged.focusArea,
          max_improvements: merged.maxImprovements,
          practice_mode: merged.practiceMode,
          groq_api_key: merged.groqApiKey,
          groq_model: merged.groqModel,
          openai_api_key: merged.openaiApiKey,
          tts_engine: merged.ttsEngine,
          tts_voice: merged.ttsVoice,
          default_mode: merged.defaultMode,
        };
        await supabase.from('settings').upsert(dbRow);
      }
    } catch (err) {
      console.warn('Supabase updateSettings error:', err);
    }
  }

  return merged;
}

// ── Stats ──────────────────────────────────────────────────────────

export async function getStats() {
  const improvements = await getImprovements();
  const cards = await getSrsCards();
  const dueCards = await getDueCards();
  const sessions = await getSessions();

  const mature = cards.filter((c) => c.status === 'mature').length;
  const newCards = cards.filter((c) => c.status === 'new').length;

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
    totalSessions: sessions.length,
    dueToday: dueCards.length,
    newCards,
    mature,
    streak,
    masteryPercent: improvements.length > 0 ? Math.round((mature / improvements.length) * 100) : 0,
  };
}

// ── Activity Logs ──────────────────────────────────────────────────

export async function getActivityLogs() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapActivityLogFromDb);
  }
  return readLocalStore(STORAGE_KEYS.activityLogs) || [];
}

export async function logActivity({ type, durationSeconds, sessionId = null, topicId = null }) {
  if (!durationSeconds || durationSeconds <= 0) return null;
  const entry = {
    id: generateId(),
    type,
    durationSeconds: Math.round(durationSeconds),
    sessionId,
    topicId,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('activity_logs').insert(mapActivityLogToDb(entry)).select().single();
    if (!error && data) {
      if (sessionId && type === 'session') {
        const session = await getSession(sessionId);
        if (session) {
          await updateSession(sessionId, {
            durationSeconds: (session.durationSeconds || 0) + Math.round(durationSeconds),
          });
        }
      }
      return mapActivityLogFromDb(data);
    }
  }

  const logs = readLocalStore(STORAGE_KEYS.activityLogs) || [];
  logs.unshift(entry);
  writeLocalStore(STORAGE_KEYS.activityLogs, logs);

  if (sessionId && type === 'session') {
    const session = await getSession(sessionId);
    if (session) {
      await updateSession(sessionId, {
        durationSeconds: (session.durationSeconds || 0) + Math.round(durationSeconds),
      });
    }
  }

  return entry;
}

export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const secs = Math.round(totalSeconds);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export async function getTopicTime(topicId) {
  const topic = await getTopic(topicId);
  if (!topic) return 0;

  const sessions = (await getSessions()).filter((s) => s.topicId === topicId);
  const sessionIds = new Set(sessions.map((s) => s.id));

  const sessionPracticeTime = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  const logs = await getActivityLogs();
  const reviewTime = logs
    .filter((l) => l.type === 'review' && (l.topicId === topicId || (l.sessionId && sessionIds.has(l.sessionId))))
    .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

  const standaloneSessionTime = logs
    .filter((l) => l.type === 'session' && l.topicId === topicId && !l.sessionId)
    .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

  return sessionPracticeTime + reviewTime + standaloneSessionTime;
}

export async function getActivityStats() {
  const logs = await getActivityLogs();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  let todayTimeSeconds = 0;
  let totalTimeSeconds = 0;
  let reviewTimeSeconds = 0;
  let sessionTimeSeconds = 0;

  logs.forEach((log) => {
    const dur = log.durationSeconds || 0;
    totalTimeSeconds += dur;
    if (log.type === 'review') reviewTimeSeconds += dur;
    if (log.type === 'session') sessionTimeSeconds += dur;

    const d = new Date(log.createdAt);
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dateStr === todayStr) {
      todayTimeSeconds += dur;
    }
  });

  return {
    todayTimeSeconds,
    totalTimeSeconds,
    reviewTimeSeconds,
    sessionTimeSeconds,
  };
}

export async function getSessionTime(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return 0;
  const directDuration = session.durationSeconds || 0;
  const logs = await getActivityLogs();
  const reviewTime = logs
    .filter((l) => l.type === 'review' && l.sessionId === sessionId)
    .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  return directDuration + reviewTime;
}

// ── Word Metrics ──────────────────────────────────────────────────

export function countTextWords(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 };
  }
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length === 0) {
    return { totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 };
  }
  const unique = new Set(words);
  const totalWords = words.length;
  const uniqueWords = unique.size;
  const vocabularyDensity = Math.round((uniqueWords / totalWords) * 1000) / 1000;
  return { totalWords, uniqueWords, vocabularyDensity };
}

export async function getSessionWordMetrics(sessionId) {
  const session = await getSession(sessionId);
  if (!session || !session.rawText) {
    return { totalWords: 0, uniqueWords: 0, vocabularyDensity: 0 };
  }
  return countTextWords(session.rawText);
}

export async function getTopicWordMetrics(topicId) {
  const sessions = (await getSessions()).filter((s) => s.topicId === topicId && s.rawText);
  if (sessions.length === 0) {
    return { totalWords: 0, uniqueWords: 0, vocabularyDensity: 0, sessionCountWithText: 0 };
  }
  let allWords = [];
  sessions.forEach((s) => {
    const words = s.rawText.toLowerCase().match(/\b\w+\b/g) || [];
    allWords.push(...words);
  });
  if (allWords.length === 0) {
    return { totalWords: 0, uniqueWords: 0, vocabularyDensity: 0, sessionCountWithText: 0 };
  }
  const unique = new Set(allWords);
  const totalWords = allWords.length;
  const uniqueWords = unique.size;
  const vocabularyDensity = Math.round((uniqueWords / totalWords) * 1000) / 1000;
  return {
    totalWords,
    uniqueWords,
    vocabularyDensity,
    sessionCountWithText: sessions.length,
  };
}

export async function getTodayWordMetrics() {
  const sessions = await getSessions();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let todayWords = 0;

  sessions.forEach((s) => {
    if (!s.rawText) return;
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dateStr === todayStr) {
      const { totalWords } = countTextWords(s.rawText);
      todayWords += totalWords;
    }
  });

  return todayWords;
}

export async function getAllTimeWordMetrics() {
  const sessions = (await getSessions()).filter((s) => s.rawText);
  if (sessions.length === 0) {
    return { totalWords: 0, uniqueWords: 0, avgDensity: 0, sessionCountWithText: 0 };
  }
  let allWords = [];
  let totalDensitySum = 0;

  sessions.forEach((s) => {
    const { totalWords, vocabularyDensity } = countTextWords(s.rawText);
    const words = s.rawText.toLowerCase().match(/\b\w+\b/g) || [];
    allWords.push(...words);
    totalDensitySum += vocabularyDensity;
  });

  if (allWords.length === 0) {
    return { totalWords: 0, uniqueWords: 0, avgDensity: 0, sessionCountWithText: 0 };
  }

  const unique = new Set(allWords);
  const totalWords = allWords.length;
  const uniqueWords = unique.size;
  const avgDensity = Math.round((totalDensitySum / sessions.length) * 1000) / 1000;

  return {
    totalWords,
    uniqueWords,
    avgDensity,
    sessionCountWithText: sessions.length,
  };
}

export async function getTopicsWithSessions() {
  const topics = await getTopics();
  const allSessions = await getSessions();
  const improvements = await getImprovements();
  const sessionMap = new Map(allSessions.map((s) => [s.id, s]));

  const enriched = await Promise.all(
    topics.map(async (topic) => {
      const sessions = (
        await Promise.all(
          (topic.sessionIds || []).map(async (id) => {
            const s = sessionMap.get(id);
            if (!s) return null;
            const wordMetrics = countTextWords(s.rawText);
            const totalTimeSeconds = await getSessionTime(s.id);
            return {
              ...s,
              totalTimeSeconds,
              totalWords: wordMetrics.totalWords,
              uniqueWords: wordMetrics.uniqueWords,
              vocabularyDensity: wordMetrics.vocabularyDensity,
            };
          })
        )
      ).filter(Boolean);

      const totalPhrases = sessions.reduce((sum, s) => {
        const sessionImps = improvements.filter((i) => i.sessionId === s.id);
        return sum + sessionImps.length;
      }, 0);

      const latestDate = sessions.reduce((latest, s) => {
        const d = new Date(s.createdAt);
        return d > latest ? d : latest;
      }, new Date(0));

      const totalTimeSeconds = await getTopicTime(topic.id);
      const topicWordMetrics = await getTopicWordMetrics(topic.id);

      return {
        ...topic,
        sessions,
        totalPhrases,
        latestDate,
        totalTimeSeconds,
        totalWords: topicWordMetrics.totalWords,
        uniqueWords: topicWordMetrics.uniqueWords,
        vocabularyDensity: topicWordMetrics.vocabularyDensity,
      };
    })
  );

  enriched.sort((a, b) => b.latestDate - a.latestDate);
  return enriched;
}

// ── Export / Import ────────────────────────────────────────────────

export async function exportAllData() {
  return {
    app: 'rip-it-out',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    topics: await getTopics(),
    sessions: await getSessions(),
    improvements: await getImprovements(),
    srsCards: await getSrsCards(),
    activityLogs: await getActivityLogs(),
  };
}

export async function importData(data, mode = 'merge') {
  if (data.app !== 'rip-it-out') throw new Error('Invalid export file');

  if (mode === 'replace') {
    if (isSupabaseConfigured) {
      await supabase.from('activity_logs').delete().neq('id', '');
      await supabase.from('srs_cards').delete().neq('improvement_id', '');
      await supabase.from('improvements').delete().neq('id', '');
      await supabase.from('sessions').delete().neq('id', '');
      await supabase.from('topics').delete().neq('id', '');

      if (data.topics) await supabase.from('topics').insert(data.topics.map(mapTopicToDb));
      if (data.sessions) await supabase.from('sessions').insert(data.sessions.map(mapSessionToDb));
      if (data.improvements) await supabase.from('improvements').insert(data.improvements.map(mapImprovementToDb));
      if (data.srsCards) await supabase.from('srs_cards').insert(data.srsCards.map(mapSrsCardToDb));
      if (data.activityLogs) await supabase.from('activity_logs').insert(data.activityLogs.map(mapActivityLogToDb));
      if (data.settings) await updateSettings(data.settings);
      return;
    }

    writeLocalStore(STORAGE_KEYS.topics, data.topics || []);
    writeLocalStore(STORAGE_KEYS.sessions, data.sessions || []);
    writeLocalStore(STORAGE_KEYS.improvements, data.improvements || []);
    writeLocalStore(STORAGE_KEYS.srsCards, data.srsCards || []);
    writeLocalStore(STORAGE_KEYS.activityLogs, data.activityLogs || []);
    if (data.settings) writeLocalStore(STORAGE_KEYS.settings, data.settings);
    return;
  }

  // Merge mode
  if (data.topics) {
    const existing = await getTopics();
    const existingIds = new Set(existing.map((t) => t.id));
    const newItems = data.topics.filter((t) => !existingIds.has(t.id));
    if (isSupabaseConfigured && newItems.length > 0) {
      await supabase.from('topics').insert(newItems.map(mapTopicToDb));
    } else if (newItems.length > 0) {
      writeLocalStore(STORAGE_KEYS.topics, [...existing, ...newItems]);
    }
  }

  if (data.sessions) {
    const existing = await getSessions();
    const existingIds = new Set(existing.map((s) => s.id));
    const newItems = data.sessions.filter((s) => !existingIds.has(s.id));
    if (isSupabaseConfigured && newItems.length > 0) {
      await supabase.from('sessions').insert(newItems.map(mapSessionToDb));
    } else if (newItems.length > 0) {
      writeLocalStore(STORAGE_KEYS.sessions, [...existing, ...newItems]);
    }
  }

  if (data.improvements) {
    const existing = await getImprovements();
    const existingIds = new Set(existing.map((i) => i.id));
    const newItems = data.improvements.filter((i) => !existingIds.has(i.id));
    if (isSupabaseConfigured && newItems.length > 0) {
      await supabase.from('improvements').insert(newItems.map(mapImprovementToDb));
    } else if (newItems.length > 0) {
      writeLocalStore(STORAGE_KEYS.improvements, [...existing, ...newItems]);
    }
  }

  if (data.srsCards) {
    const existing = await getSrsCards();
    const existingIds = new Set(existing.map((c) => c.improvementId));
    const newItems = data.srsCards.filter((c) => !existingIds.has(c.improvementId));
    if (isSupabaseConfigured && newItems.length > 0) {
      await supabase.from('srs_cards').insert(newItems.map(mapSrsCardToDb));
    } else if (newItems.length > 0) {
      writeLocalStore(STORAGE_KEYS.srsCards, [...existing, ...newItems]);
    }
  }

  if (data.activityLogs) {
    const existing = await getActivityLogs();
    const existingIds = new Set(existing.map((l) => l.id));
    const newItems = data.activityLogs.filter((l) => !existingIds.has(l.id));
    if (isSupabaseConfigured && newItems.length > 0) {
      await supabase.from('activity_logs').insert(newItems.map(mapActivityLogToDb));
    } else if (newItems.length > 0) {
      writeLocalStore(STORAGE_KEYS.activityLogs, [...existing, ...newItems]);
    }
  }
}

export async function clearAllData() {
  if (isSupabaseConfigured) {
    await supabase.from('activity_logs').delete().neq('id', '');
    await supabase.from('srs_cards').delete().neq('improvement_id', '');
    await supabase.from('improvements').delete().neq('id', '');
    await supabase.from('sessions').delete().neq('id', '');
    await supabase.from('topics').delete().neq('id', '');
  }
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}
