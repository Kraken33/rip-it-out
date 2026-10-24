import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createSession, 
  getSettings,
  getSessions,
  logActivity,
  updateSession
} from '../store';
import { 
  VARIETY_MATRIX,
  VARIETY_PRESETS
} from '../prompts';
import SeamlessChatSession from './SeamlessChatSession';
import TranslationStorySession from './TranslationStorySession';
import { useVisualViewport } from '../hooks/useVisualViewport';

const SOURCE_TYPES = [
  { id: 'video', label: 'Video', icon: '▶️' },
  { id: 'podcast', label: 'Podcast', icon: '🎧' },
  { id: 'article', label: 'Article', icon: '📄' },
  { id: 'book', label: 'Book', icon: '📚' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const ACTIVITIES = [
  {
    id: 'dialogue',
    label: 'Free Dialogue',
    icon: '💬',
    description: 'Speak and practice with interactive AI coach',
  },
  {
    id: 'translation',
    label: 'Story Translation',
    icon: '📖',
    description: 'Translate AI-written Russian stories, harvest constructions',
  },
];

export default function Session() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState(null);
  const [existingSessions, setExistingSessions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [st, sess] = await Promise.all([getSettings(), getSessions()]);
        if (isMounted) {
          setSettings(st);
          setExistingSessions(sess);
        }
      } catch (err) {
        console.error('Error loading session screen data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 1 State
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  // Activity picked at Step 1; branches Step 2 (dialogue chat vs story translation).
  const [activity, setActivity] = useState('dialogue');
  // Optional learner-authored topic/demands for the story-translation activity.
  const [storyDemands, setStoryDemands] = useState('');
  // Variety Matrix state for translation stories
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [varietyMatrix, setVarietyMatrix] = useState({
    domain: 'auto',
    tone: 'auto',
    format: 'auto',
    catalyst: 'auto',
  });

  // Map of unique previous titles with their most recent session data
  const previousTitlesMap = useMemo(() => {
    const map = new Map();
    existingSessions.forEach((s) => {
      if (s.title && !map.has(s.title)) {
        map.set(s.title, s);
      }
    });
    return Array.from(map.values());
  }, [existingSessions]);

  const autofillFromSession = useCallback((selectedTitle) => {
    if (!selectedTitle) return;
    const match = existingSessions.find((s) => s.title === selectedTitle);
    if (match) {
      setTitle(match.title);
      if (match.sourceType) setSourceType(match.sourceType);
      if (match.tags && Array.isArray(match.tags)) setTags(match.tags.join(', '));
      if (match.notes) setNotes(match.notes || '');
    }
  }, [existingSessions]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const match = existingSessions.find((s) => s.title.toLowerCase() === val.toLowerCase().trim());
    if (match) {
      if (match.sourceType) setSourceType(match.sourceType);
      if (match.tags && Array.isArray(match.tags)) setTags(match.tags.join(', '));
      if (match.notes) setNotes(match.notes || '');
    }
  };

  // Data State
  const [session, setSession] = useState(null);

  const handleCreateSession = useCallback(async (e) => {
    e.preventDefault();
    if (activity === 'dialogue' && (!title || !sourceType)) return;

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);
      let newSession;
      if (activity === 'dialogue') {
        newSession = await createSession({
          title,
          sourceType,
          tags: tagArray,
          notes,
          activity,
        });
      } else {
        const demands = storyDemands.trim();
        const dateTitle = new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        newSession = await createSession({
          title: demands || `Story — ${dateTitle}`,
          sourceType: 'other',
          tags: [],
          notes: '',
          activity: 'translation',
          messages: [{ role: 'user', content: `__story_demands:${demands}` }],
        });
        newSession = { ...newSession, storyDemands: demands, varietyMatrix };
      }
      setSession(newSession);
      setStartTime(Date.now());
      setStep(2);
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  }, [title, sourceType, tags, notes, activity, storyDemands, varietyMatrix]);

  const handleSeamlessFinish = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTranslationFinish = useCallback(async (roundsPayload) => {
    const allRounds = Array.isArray(roundsPayload) ? roundsPayload : roundsPayload?.rounds;
    const completedRounds = (allRounds || []).filter((r) => r?.translation?.trim());
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    if (session?.id && completedRounds.length > 0) {
      const messages = completedRounds.map((r, i) => ({
        role: 'story-round',
        round: i + 1,
        passage: r.passage || '',
        translation: r.translation || '',
        improvedVersion: r.feedback?.improvedVersion || '',
        constructions: r.feedback?.constructions || [],
      }));
      const rawText = completedRounds.map((r) => r.translation.trim()).join('\n\n');
      try {
        await updateSession(session.id, {
          activity: 'translation',
          rawText: rawText || null,
          messages,
        });
        if (durationSeconds > 0) {
          await logActivity({
            type: 'session',
            durationSeconds,
            sessionId: session.id,
            topicId: session.topicId,
          });
        }
      } catch (err) {
        console.error('Error saving translation story session:', err);
      }
    }

    navigate('/');
  }, [session, startTime, navigate]);

  const isInteractiveActive = step === 2;
  const { viewportHeight, viewportWidth } = useVisualViewport({ lockBodyScroll: isInteractiveActive });

  return (
    <div
      className={`w-full ${
        isInteractiveActive
          ? 'h-[100dvh] sm:h-[88vh] flex flex-col max-w-4xl mx-auto -my-1 sm:my-0 fixed sm:static inset-0 z-20 bg-[var(--bg-main)] sm:bg-transparent overflow-hidden'
          : 'space-y-6 animate-fade-in max-w-2xl mx-auto py-2'
      }`}
      style={
        isInteractiveActive && viewportWidth < 640
          ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
          : undefined
      }
    >
      {!isInteractiveActive && (
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">New Practice Session</h1>
          <p className="text-xs text-[var(--text-secondary)]">Start an interactive AI dialogue or story session.</p>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleCreateSession} className="glass-panel p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Activity <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  id={`activity-${a.id}`}
                  onClick={() => setActivity(a.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    activity === a.id
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold'
                      : 'border-gray-800 bg-[#1b1c2b] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{a.icon}</span>
                  <span className="text-xs">{a.label}</span>
                  <span className="text-[10px] mt-0.5 font-normal opacity-70 text-center leading-tight">
                    {a.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {activity === 'translation' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="story-demands" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Story Topics / Demands <span className="text-gray-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="story-demands"
                  value={storyDemands}
                  onChange={(e) => setStoryDemands(e.target.value)}
                  placeholder="e.g. ordering at a restaurant, small talk with coworkers, travel stories..."
                  rows={2}
                  className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all resize-none font-medium"
                />
              </div>

              {/* Collapsible Variety Matrix */}
              <div className="rounded-xl border border-[#27283d] bg-[#141523]/60 p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setMatrixOpen(!matrixOpen)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-purple-300 hover:text-purple-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Story Flavor & Variety Matrix</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      ({selectedPreset ? VARIETY_PRESETS.find((p) => p.id === selectedPreset)?.label : 'Auto / Random Variety'})
                    </span>
                  </span>
                  <span className="text-xs">{matrixOpen ? '▲ Hide' : '▼ Customize'}</span>
                </button>

                {matrixOpen && (
                  <div className="pt-2 border-t border-[#27283d] space-y-3">
                    {/* Presets Grid */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Quick Flavor Presets
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {VARIETY_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPreset(p.id);
                              setVarietyMatrix({ ...p.matrix });
                            }}
                            className={`p-1.5 rounded-lg border text-left transition cursor-pointer flex items-center gap-1.5 ${
                              selectedPreset === p.id
                                ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                                : 'border-[#27283d] bg-[#1b1c2b] text-gray-300 hover:border-gray-600'
                            }`}
                          >
                            <span className="text-sm">{p.icon}</span>
                            <span className="text-[11px] truncate">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimension Dropdowns */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <label htmlFor="matrix-domain" className="block text-[10px] text-gray-400 mb-0.5">Domain</label>
                        <select
                          id="matrix-domain"
                          value={varietyMatrix.domain}
                          onChange={(e) => {
                            setSelectedPreset(null);
                            setVarietyMatrix((m) => ({ ...m, domain: e.target.value }));
                          }}
                          className="w-full bg-[#1b1c2b] border border-[#27283d] rounded p-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="auto">🎲 Auto (Random)</option>
                          {VARIETY_MATRIX.domains.map((d) => (
                            <option key={d.id} value={d.id}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="matrix-tone" className="block text-[10px] text-gray-400 mb-0.5">Tone</label>
                        <select
                          id="matrix-tone"
                          value={varietyMatrix.tone}
                          onChange={(e) => {
                            setSelectedPreset(null);
                            setVarietyMatrix((m) => ({ ...m, tone: e.target.value }));
                          }}
                          className="w-full bg-[#1b1c2b] border border-[#27283d] rounded p-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="auto">🎲 Auto (Random)</option>
                          {VARIETY_MATRIX.tones.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="matrix-format" className="block text-[10px] text-gray-400 mb-0.5">Format</label>
                        <select
                          id="matrix-format"
                          value={varietyMatrix.format}
                          onChange={(e) => {
                            setSelectedPreset(null);
                            setVarietyMatrix((m) => ({ ...m, format: e.target.value }));
                          }}
                          className="w-full bg-[#1b1c2b] border border-[#27283d] rounded p-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="auto">🎲 Auto (Random)</option>
                          {VARIETY_MATRIX.formats.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="matrix-catalyst" className="block text-[10px] text-gray-400 mb-0.5">Catalyst</label>
                        <select
                          id="matrix-catalyst"
                          value={varietyMatrix.catalyst}
                          onChange={(e) => {
                            setSelectedPreset(null);
                            setVarietyMatrix((m) => ({ ...m, catalyst: e.target.value }));
                          }}
                          className="w-full bg-[#1b1c2b] border border-[#27283d] rounded p-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="auto">🎲 Auto (Random)</option>
                          {VARIETY_MATRIX.catalysts.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activity === 'dialogue' && (
            <>
              {/* Previous Titles Dropdown */}
              {previousTitlesMap.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="select-prev-title" className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Continue a Previous Topic</span>
                    <span className="text-[10px] text-gray-500 font-normal">Autofills details</span>
                  </label>
                  <select
                    id="select-prev-title"
                    value=""
                    onChange={(e) => autofillFromSession(e.target.value)}
                    className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-all font-medium"
                  >
                    <option value="" disabled>-- Select a past session to copy info --</option>
                    {previousTitlesMap.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} ({SOURCE_TYPES.find((t) => t.id === s.sourceType)?.label || s.sourceType || 'Other'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label htmlFor="session-title" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Session Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="session-title"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Atomic Habits Chapter 1"
                  required
                  className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
                />
              </div>

              {/* Source Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Source Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SOURCE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSourceType(type.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                        sourceType === type.id
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold'
                          : 'border-[#27283d] bg-[#1b1c2b] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg mb-1">{type.icon}</span>
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label htmlFor="session-tags" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Tags <span className="text-gray-500 font-normal lowercase">(comma-separated)</span>
                </label>
                <input
                  id="session-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="habits, psychology, productivity"
                  className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
                />
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label htmlFor="session-notes" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Notes <span className="text-gray-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="session-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any context about this session..."
                  rows={2}
                  className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all resize-none font-medium"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              id="btn-generate-prompt"
              type="submit"
              disabled={(activity === 'dialogue' && (!title || !sourceType)) || loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Session...' : 'Start Seamless Voice Session →'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && activity === 'translation' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <TranslationStorySession
            session={session}
            settings={settings}
            onFinish={handleTranslationFinish}
          />
        </div>
      )}

      {step === 2 && activity === 'dialogue' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <SeamlessChatSession session={session} settings={settings} onFinish={handleSeamlessFinish} />
        </div>
      )}
    </div>
  );
}
