import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabaseClient so all tests use the localStorage fallback path
vi.mock('../supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import {
  getSessions,
  createSession,
  deleteSession,
  getImprovements,
  addImprovements,
  deleteImprovement,
  getSrsCards,
  findDuplicate,
  getSettings,
  updateSettings,
  getStats,
  exportAllData,
  importData,
  clearAllData,
  getTopics,
  getTopic,
  getOrCreateTopic,
  logActivity,
  getActivityLogs,
  formatDuration,
  getTopicTime,
  getSessionTime,
  getActivityStats,
} from '../store';

describe('Store Layer', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('creates and reads sessions with messages array', async () => {
    const messages = [
      { id: 'm1', role: 'user', content: 'hello' },
      { id: 'm2', role: 'assistant', content: 'hi' }
    ];
    const session = await createSession({ title: 'Podcast 1', sourceType: 'podcast', tags: ['audio'], notes: 'test note', messages });
    expect(session.id).toBeDefined();
    expect(session.title).toBe('Podcast 1');
    expect(session.messages).toEqual(messages);
    const all = await getSessions();
    expect(all).toHaveLength(1);
    expect(all[0].messages).toEqual(messages);
  });

  it('adds improvements with sentence context', async () => {
    const session = await createSession({ title: 'Book 1', sourceType: 'book' });
    const items = [
      { construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over', explanation: 'natural', category: 'grammar', spoken_frequency: 'high', context: 'I invited him home yesterday.' }
    ];
    const added = await addImprovements(session.id, items);
    expect(added).toHaveLength(1);
    expect(added[0].context).toBe('I invited him home yesterday.');
    const imps = await getImprovements();
    expect(imps[0].context).toBe('I invited him home yesterday.');
  });

  it('finds duplicate phrases case-insensitively', async () => {
    const session = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(session.id, [{ original: 'Invited Him Home', improved: 'invited him over', explanation: 'exp' }]);
    expect(await findDuplicate('invited him home')).toBeDefined();
    expect(await findDuplicate('completely new phrase')).toBeUndefined();
  });

  it('deletes improvement and cascades deletion of SRS card', async () => {
    const session = await createSession({ title: 'S1', sourceType: 'video' });
    const [imp] = await addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    expect(await getImprovements()).toHaveLength(1);
    expect(await getSrsCards()).toHaveLength(1);

    await deleteImprovement(imp.id);
    expect(await getImprovements()).toHaveLength(0);
    expect(await getSrsCards()).toHaveLength(0);
  });

  it('deletes session and cascades deletion of improvements and cards', async () => {
    const session = await createSession({ title: 'S1', sourceType: 'video' });
    await addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    expect(await getSessions()).toHaveLength(1);
    expect(await getImprovements()).toHaveLength(1);

    await deleteSession(session.id);
    expect(await getSessions()).toHaveLength(0);
    expect(await getImprovements()).toHaveLength(0);
    expect(await getSrsCards()).toHaveLength(0);
  });

  it('updates settings', async () => {
    expect((await getSettings()).formality).toBe('casual');
    await updateSettings({ formality: 'semi-formal' });
    expect((await getSettings()).formality).toBe('semi-formal');
  });

  it('calculates correct stats', async () => {
    const stats = await getStats();
    expect(stats.totalImprovements).toBe(0);
    expect(stats.totalSessions).toBe(0);
  });

  it('exports and imports backup data in replace mode', async () => {
    const session = await createSession({ title: 'Export Session', sourceType: 'article' });
    await addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    const backup = await exportAllData();
    expect(backup.app).toBe('rip-it-out');
    expect(backup.topics).toBeDefined();

    await clearAllData();
    expect(await getSessions()).toHaveLength(0);

    await importData(backup, 'replace');
    expect(await getSessions()).toHaveLength(1);
    expect(await getImprovements()).toHaveLength(1);
    expect(await getTopics()).toHaveLength(1);
  });
});

describe('Topics — getOrCreateTopic', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('creates a new topic for an unknown title', async () => {
    const topic = await getOrCreateTopic('Friends S3');
    expect(topic.id).toBeDefined();
    expect(topic.title).toBe('Friends S3');
    expect(await getTopics()).toHaveLength(1);
  });

  it('returns the same topic for a known title', async () => {
    const first = await getOrCreateTopic('Breaking Bad');
    const second = await getOrCreateTopic('Breaking Bad');
    expect(second.id).toBe(first.id);
    expect(await getTopics()).toHaveLength(1);
  });

  it('id on returned object is stable across multiple calls', async () => {
    const a = await getOrCreateTopic('Stable Topic');
    const b = await getOrCreateTopic('Stable Topic');
    const c = await getOrCreateTopic('Stable Topic');
    expect(a.id).toBe(b.id);
    expect(b.id).toBe(c.id);
  });

  it('getTopic returns null for unknown id', async () => {
    expect(await getTopic('nonexistent-id')).toBeNull();
  });

  it('creates a new session with topicId set', async () => {
    const session = await createSession({ title: 'My Show', sourceType: 'video' });
    expect(session.topicId).toBeDefined();
    const topic = await getTopic(session.topicId);
    expect(topic).not.toBeNull();
    expect(topic.title).toBe('My Show');
  });

  it('attaches new session to existing topic when title matches', async () => {
    const s1 = await createSession({ title: 'Podcast X', sourceType: 'podcast' });
    const s2 = await createSession({ title: 'Podcast X', sourceType: 'podcast' });
    expect(s1.topicId).toBe(s2.topicId);
    expect(await getTopics()).toHaveLength(1);
    const topic = await getTopic(s1.topicId);
    expect(topic.sessionIds).toContain(s1.id);
    expect(topic.sessionIds).toContain(s2.id);
  });
});

describe('Activity Logs & Time Tracking', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('logs activity duration and retrieves activity logs', async () => {
    const entry = await logActivity({ type: 'session', durationSeconds: 120 });
    expect(entry).not.toBeNull();
    expect(entry.durationSeconds).toBe(120);
    expect(entry.type).toBe('session');

    const logs = await getActivityLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(entry.id);
  });

  it('formats duration strings cleanly', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(125)).toBe('2m 5s');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3720)).toBe('1h 2m');
  });

  it('calculates topic time combining session direct duration and review logs', async () => {
    const session = await createSession({ title: 'Topic Time Test', sourceType: 'video' });
    await logActivity({ type: 'session', durationSeconds: 300, sessionId: session.id, topicId: session.topicId });
    await logActivity({ type: 'review', durationSeconds: 150, sessionId: session.id, topicId: session.topicId });

    const totalTopicTime = await getTopicTime(session.topicId);
    expect(totalTopicTime).toBe(450); // 300s session + 150s review
  });

  it('calculates individual session time correctly with getSessionTime', async () => {
    const session = await createSession({ title: 'Session Time Test', sourceType: 'podcast' });
    await logActivity({ type: 'session', durationSeconds: 180, sessionId: session.id, topicId: session.topicId });
    await logActivity({ type: 'review', durationSeconds: 90, sessionId: session.id, topicId: session.topicId });

    const sessionTime = await getSessionTime(session.id);
    expect(sessionTime).toBe(270); // 180s practice + 90s review
  });

  it('calculates activity stats correctly', async () => {
    await logActivity({ type: 'session', durationSeconds: 200 });
    await logActivity({ type: 'review', durationSeconds: 100 });

    const stats = await getActivityStats();
    expect(stats.todayTimeSeconds).toBe(300);
    expect(stats.totalTimeSeconds).toBe(300);
    expect(stats.sessionTimeSeconds).toBe(200);
    expect(stats.reviewTimeSeconds).toBe(100);
  });
});
