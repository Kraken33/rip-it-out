import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getStats, getSessions, getImprovementsBySession } from '../store';

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
    other: '📝'
  };
  return icons[type?.toLowerCase()] || '📝';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    setStats(getStats());
    const sessions = getSessions();
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setRecentSessions(sessions.slice(0, 5));
  }, []);

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
          Extract natural spoken phrases & master them with AI prompts
        </p>
      </header>

      {/* Due Today Card */}
      <div className="glass-panel p-8 sm:p-10 text-center flex flex-col items-center justify-center border border-purple-500/30 relative overflow-hidden box-glow">
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
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Header */}
      <div className="flex justify-between items-center pt-4">
        <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
        <button 
          id="btn-new-session-dashboard"
          onClick={() => navigate('/session/new')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-lg leading-none">+</span> New Session
        </button>
      </div>

      {/* Recent Sessions List */}
      <div className="space-y-3">
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => {
            const improvementsCount = getImprovementsBySession(session.id).length;
            return (
              <Link 
                key={session.id} 
                to={`/library?session=${session.id}`}
                className="glass-panel p-4 hover:bg-[#1f2032] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl border border-gray-700">
                    {getSourceIcon(session.sourceType)}
                  </div>
                  <div>
                    <div className="font-bold text-base text-gray-200 group-hover:text-purple-400 transition-colors line-clamp-1">
                      {session.title || 'Untitled Session'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(session.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-300 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                  {improvementsCount} {improvementsCount === 1 ? 'phrase' : 'phrases'}
                </div>
              </Link>
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
