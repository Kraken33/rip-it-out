import { describe, it, expect, beforeEach } from 'vitest';
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
  migrateSessionsToTopics,
} from '../store';

describe('Store Layer', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('creates and reads sessions', () => {
    const session = createSession({ title: 'Podcast 1', sourceType: 'podcast', tags: ['audio'], notes: 'test note' });
    expect(session.id).toBeDefined();
    expect(session.title).toBe('Podcast 1');
    const all = getSessions();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(session.id);
  });

  it('adds improvements and creates corresponding SRS cards', () => {
    const session = createSession({ title: 'Book 1', sourceType: 'book' });
    const items = [
      { construction: 'invite [someone] over', original: 'invited him home', improved: 'invited him over', explanation: 'natural', category: 'grammar', spoken_frequency: 'high' }
    ];
    const added = addImprovements(session.id, items);
    expect(added).toHaveLength(1);
    expect(getImprovements()).toHaveLength(1);
    const cards = getSrsCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].improvementId).toBe(added[0].id);
  });

  it('finds duplicate phrases case-insensitively', () => {
    const session = createSession({ title: 'S1', sourceType: 'video' });
    addImprovements(session.id, [{ original: 'Invited Him Home', improved: 'invited him over', explanation: 'exp' }]);
    expect(findDuplicate('invited him home')).toBeDefined();
    expect(findDuplicate('completely new phrase')).toBeUndefined();
  });

  it('deletes improvement and cascades deletion of SRS card', () => {
    const session = createSession({ title: 'S1', sourceType: 'video' });
    const [imp] = addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    expect(getImprovements()).toHaveLength(1);
    expect(getSrsCards()).toHaveLength(1);

    deleteImprovement(imp.id);
    expect(getImprovements()).toHaveLength(0);
    expect(getSrsCards()).toHaveLength(0);
  });

  it('deletes session and cascades deletion of improvements and cards', () => {
    const session = createSession({ title: 'S1', sourceType: 'video' });
    addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    expect(getSessions()).toHaveLength(1);
    expect(getImprovements()).toHaveLength(1);

    deleteSession(session.id);
    expect(getSessions()).toHaveLength(0);
    expect(getImprovements()).toHaveLength(0);
    expect(getSrsCards()).toHaveLength(0);
  });

  it('updates settings', () => {
    expect(getSettings().formality).toBe('casual');
    updateSettings({ formality: 'semi-formal' });
    expect(getSettings().formality).toBe('semi-formal');
  });

  it('calculates correct stats', () => {
    const stats = getStats();
    expect(stats.totalImprovements).toBe(0);
    expect(stats.totalSessions).toBe(0);
  });

  it('exports and imports backup data in replace mode', () => {
    const session = createSession({ title: 'Export Session', sourceType: 'article' });
    addImprovements(session.id, [{ original: 'old', improved: 'new', explanation: 'why' }]);
    const backup = exportAllData();
    expect(backup.app).toBe('rip-it-out');
    expect(backup.topics).toBeDefined();

    clearAllData();
    expect(getSessions()).toHaveLength(0);

    importData(backup, 'replace');
    expect(getSessions()).toHaveLength(1);
    expect(getImprovements()).toHaveLength(1);
    expect(getTopics()).toHaveLength(1);
  });
});

describe('Topics — getOrCreateTopic', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('creates a new topic for an unknown title', () => {
    const topic = getOrCreateTopic('Friends S3');
    expect(topic.id).toBeDefined();
    expect(topic.title).toBe('Friends S3');
    expect(getTopics()).toHaveLength(1);
  });

  it('returns the same topic for a known title', () => {
    const first = getOrCreateTopic('Breaking Bad');
    const second = getOrCreateTopic('Breaking Bad');
    expect(second.id).toBe(first.id);
    expect(getTopics()).toHaveLength(1);
  });

  it('id on returned object is stable across multiple calls', () => {
    const a = getOrCreateTopic('Stable Topic');
    const b = getOrCreateTopic('Stable Topic');
    const c = getOrCreateTopic('Stable Topic');
    expect(a.id).toBe(b.id);
    expect(b.id).toBe(c.id);
  });

  it('getTopic returns null for unknown id', () => {
    expect(getTopic('nonexistent-id')).toBeNull();
  });

  it('creates a new session with topicId set', () => {
    const session = createSession({ title: 'My Show', sourceType: 'video' });
    expect(session.topicId).toBeDefined();
    const topic = getTopic(session.topicId);
    expect(topic).not.toBeNull();
    expect(topic.title).toBe('My Show');
  });

  it('attaches new session to existing topic when title matches', () => {
    const s1 = createSession({ title: 'Podcast X', sourceType: 'podcast' });
    const s2 = createSession({ title: 'Podcast X', sourceType: 'podcast' });
    expect(s1.topicId).toBe(s2.topicId);
    expect(getTopics()).toHaveLength(1);
    const topic = getTopic(s1.topicId);
    expect(topic.sessionIds).toContain(s1.id);
    expect(topic.sessionIds).toContain(s2.id);
  });
});

describe('Topics — migrateSessionsToTopics', () => {
  beforeEach(() => {
    clearAllData();
  });

  it('adds topicId to all sessions that lack one', () => {
    // Directly write a legacy session without topicId
    const legacySession = { id: 'legacy-1', title: 'Old Show', sourceType: 'video', createdAt: new Date().toISOString(), status: 'created' };
    localStorage.setItem('rio_sessions', JSON.stringify([legacySession]));

    migrateSessionsToTopics();

    const sessions = getSessions();
    expect(sessions[0].topicId).toBeDefined();
    expect(getTopics()).toHaveLength(1);
    expect(getTopics()[0].title).toBe('Old Show');
  });

  it('is idempotent — re-running leaves data unchanged', () => {
    const legacySession = { id: 'legacy-2', title: 'Old Show 2', sourceType: 'video', createdAt: new Date().toISOString(), status: 'created' };
    localStorage.setItem('rio_sessions', JSON.stringify([legacySession]));

    migrateSessionsToTopics();
    const topicsAfterFirst = getTopics().length;
    const topicIdAfterFirst = getSessions()[0].topicId;

    migrateSessionsToTopics();
    expect(getTopics()).toHaveLength(topicsAfterFirst);
    expect(getSessions()[0].topicId).toBe(topicIdAfterFirst);
  });

  it('each legacy session gets its own solo topic entity', () => {
    const sessions = [
      { id: 'leg-a', title: 'Show A', sourceType: 'video', createdAt: new Date().toISOString(), status: 'created' },
      { id: 'leg-b', title: 'Show B', sourceType: 'podcast', createdAt: new Date().toISOString(), status: 'created' },
    ];
    localStorage.setItem('rio_sessions', JSON.stringify(sessions));

    migrateSessionsToTopics();

    const topics = getTopics();
    expect(topics).toHaveLength(2);
    const topicIds = getSessions().map((s) => s.topicId);
    expect(topicIds[0]).not.toBe(topicIds[1]);
  });

  it('sessions already having topicId are not modified', () => {
    // Mix: one migrated, one legacy
    const migratedSession = { id: 'mig-1', title: 'Already Migrated', sourceType: 'video', topicId: 'existing-topic', createdAt: new Date().toISOString(), status: 'created' };
    const legacySession = { id: 'leg-c', title: 'Legacy', sourceType: 'book', createdAt: new Date().toISOString(), status: 'created' };
    localStorage.setItem('rio_sessions', JSON.stringify([migratedSession, legacySession]));
    localStorage.setItem('rio_topics', JSON.stringify([{ id: 'existing-topic', title: 'Already Migrated', createdAt: new Date().toISOString(), sessionIds: ['mig-1'] }]));

    migrateSessionsToTopics();

    const sessions = getSessions();
    expect(sessions.find((s) => s.id === 'mig-1').topicId).toBe('existing-topic');
    expect(sessions.find((s) => s.id === 'leg-c').topicId).toBeDefined();
    expect(getTopics()).toHaveLength(2);
  });
});

