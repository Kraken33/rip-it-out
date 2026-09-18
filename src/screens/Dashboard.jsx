import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getTopicsWithSessions, getActivityStats, formatDuration } from '../store';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const daysDiff = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (daysDiff === 0) return 'today';
  if (Math.abs(daysDiff) > 30) return new Date(dateString).toLocaleDateString();
  return rtf.format(daysDiff, 'day');
}

function getSourceIcon(type) {
  const icons = {
    video: '📺',
    podcast: '🎧',
    article: '📄',
    book: '📚',
    movie: '🎬',
    other: '📝',
  };
  return icons[type?.toLowerCase()] || '📝';
}

function getTopicIcon(sessions) {
  if (!sessions || sessions.length === 0) return '📝';
  // Find most common sourceType
  const freq = {};
  sessions.forEach((s) => {
    const t = s.sourceType?.toLowerCase() || 'other';
    freq[t] = (freq[t] || 0) + 1;
  });
  const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  return getSourceIcon(dominant);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  useEffect(() => {
    setStats(getStats());
    setActivityStats(getActivityStats());
    setTopics(getTopicsWithSessions());
  }, []);

  function toggleTopic(topicId) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  }

  if (!stats) return null;

  return (
    <div className="w-full space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center space-y-2 py-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-glow">
          <span className="text-purple-400">
            Rip It Out
          </span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg font-medium">
          Extract natural spoken phrases &amp; master them with AI prompts
        </p>
      </header>

      {/* Time Tracking & Due Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Time Widget */}
        <div className="sm:col-span-1 glass-panel p-6 flex flex-col justify-between border border-purple-500/20">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">⏱️ Time Spent</span>
              <button
                id="btn-view-stats"
                onClick={() => navigate('/stats')}
                className="text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Full Stats →
              </button>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Today</div>
              <div className="text-2xl font-bold text-white">{formatDuration(activityStats?.todayTimeSeconds || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Total Learning</div>
              <div className="text-lg font-semibold text-purple-300">{formatDuration(activityStats?.totalTimeSeconds || 0)}</div>
            </div>
          </div>
        </div>

        {/* Due Today Card */}
        <div className="sm:col-span-2 glass-panel p-8 sm:p-10 text-center flex flex-col items-center justify-center border border-purple-500/30 relative overflow-hidden box-glow">
          <div className="inline-block text-purple-300 font-bold mb-3 uppercase tracking-widest text-xs px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30">
            Due for Review
          </div>

          <div className="text-6xl sm:text-7xl font-extrabold text-white my-2 text-glow">
            {stats.dueToday}
          </div>

          {stats.dueToday > 0 ? (
            <p className="text-gray-300 text-base mb-6 font-medium">cards waiting for your review today</p>
          ) : (
            <p className="text-gray-300 text-base mb-6 font-medium">You're all caught up for today! Great job.</p>
          )}

          {/* Two Review Methods */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              id="btn-start-review-main"
              onClick={() => navigate('/review')}
              className="flex-1 px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              🎴 Flashcard Review
            </button>

            <button
              id="btn-practice-llm-main"
              onClick={() => navigate('/practice')}
              className="flex-1 px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-white border border-purple-500/40 font-bold text-sm rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              🤖 Practice with External LLM (Prompt #3)
            </button>
          </div>

          {stats.newCards > 0 && (
            <div className="mt-5 text-gray-400 text-xs font-medium">
              + {stats.newCards} new {stats.newCards === 1 ? 'card' : 'cards'} ready in vault
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 text-center sm:text-left space-y-1">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Learned</div>
          <div className="text-3xl font-bold text-white">{stats.totalImprovements}</div>
        </div>
        <div className="glass-panel p-5 text-center sm:text-left space-y-1">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Current Streak</div>
          <div className="text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            {stats.streak} <span className="text-xl">🔥</span>
          </div>
        </div>
        <div className="glass-panel p-5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Mastery Rate</div>
            <div className="text-xl font-bold text-white">{stats.masteryPercent}%</div>
          </div>
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, stats.masteryPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topics Header */}
      <div className="flex justify-between items-center pt-4">
        <h2 className="text-xl font-bold text-white">Topics</h2>
        <button
          id="btn-new-session-dashboard"
          onClick={() => navigate('/session/new')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-lg leading-none">+</span> New Session
        </button>
      </div>

      {/* Topics List */}
      <div className="space-y-2">
        {topics.length > 0 ? (
          topics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.id);
            return (
              <div key={topic.id} className="glass-panel overflow-hidden">
                {/* Group header */}
                <button
                  id={`topic-toggle-${topic.id}`}
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-xl border border-gray-700">
                      {getTopicIcon(topic.sessions)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base text-gray-200 truncate">
                        {topic.title || 'Untitled'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">
                          {topic.sessions.length} {topic.sessions.length === 1 ? 'session' : 'sessions'}
                        </span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-xs text-gray-500 font-medium">
                          {topic.totalPhrases} {topic.totalPhrases === 1 ? 'phrase' : 'phrases'}
                        </span>
                        {topic.totalTimeSeconds > 0 && (
                          <>
                            <span className="text-gray-700 text-xs">·</span>
                            <span className="text-xs text-purple-400 font-semibold">
                              ⏱️ {formatDuration(topic.totalTimeSeconds)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 shrink-0 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                  >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5">
                    {topic.sessions.length > 0 ? (
                      topic.sessions.map((session, idx) => (
                        <button
                          key={session.id}
                          id={`session-row-${session.id}`}
                          onClick={() => navigate(`/library?session=${session.id}`)}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer text-left ${idx !== topic.sessions.length - 1 ? 'border-b border-white/5' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shrink-0 ml-2" />
                            <span className="text-sm text-gray-400">
                              {formatRelativeTime(session.createdAt)}
                            </span>
                            {(session.totalTimeSeconds > 0 || session.durationSeconds > 0) && (
                              <span className="text-xs text-purple-400 font-medium">
                                ⏱️ {formatDuration(session.totalTimeSeconds || session.durationSeconds)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700 shrink-0">
                            {getImprovementsCount(session.id)} phrases
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-6 py-3 text-sm text-gray-600">No sessions yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-8 text-center text-gray-400 space-y-3">
            <p className="text-base">No learning sessions created yet.</p>
            <button
              onClick={() => navigate('/session/new')}
              className="px-5 py-2.5 bg-purple-600 text-white font-semibold text-sm rounded-lg hover:bg-purple-500 transition-all inline-block cursor-pointer"
            >
              Create your first session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Local helper to avoid importing getImprovementsBySession which triggers migration
function getImprovementsCount(sessionId) {
  try {
    const raw = localStorage.getItem('rio_improvements');
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((i) => i.sessionId === sessionId).length;
  } catch {
    return 0;
  }
}
