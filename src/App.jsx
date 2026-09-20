import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import Dashboard from './screens/Dashboard';
import Session from './screens/Session';
import Review from './screens/Review';
import Practice from './screens/Practice';
import Library from './screens/Library';
import Settings from './screens/Settings';
import Stats from './screens/Stats';
import { getDueCards } from './store';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/library', label: 'Library', icon: LibraryIcon },
  { path: '/session/new', label: 'New', icon: PlusIcon, accent: true },
  { path: '/review', label: 'Review', icon: ReviewIcon },
  { path: '/stats', label: 'Stats', icon: StatsIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

function AuthenticatedApp() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    async function updateDueCount() {
      try {
        const due = await getDueCards();
        setDueCount(Array.isArray(due) ? due.length : 0);
      } catch {
        setDueCount(0);
      }
    }
    if (user) {
      updateDueCount();
    }
  }, [location, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e15] flex flex-col justify-center items-center text-slate-300">
        <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm font-medium">Loading session...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const hideNav = location.pathname === '/review' || location.pathname === '/practice';

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15] text-[#f3f4f6]">
      {/* App Header with user profile & logout */}
      {!hideNav && (
        <header className="border-b border-[#27283d] bg-[#151622]/80 backdrop-blur-md px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">
                RIO
              </span>
              <span className="text-xs font-semibold text-slate-300">Rip It Out</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium truncate max-w-[140px] sm:max-w-none">
                {user.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="px-2.5 py-1 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-28">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session/new" element={<Session />} />
          <Route path="/review" element={<Review />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/library" element={<Library />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#151622]/95 backdrop-blur-md border-t border-[#27283d] z-50 py-2 px-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {NAV_ITEMS.map(({ path, label, icon: Icon, accent }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors relative ${
                    isActive ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'
                  }`
                }
              >
                {accent ? (
                  <span className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center -mt-5 shadow-lg border-2 border-[#0d0e15] transition-transform active:scale-95">
                    <Icon className="w-5 h-5" />
                  </span>
                ) : (
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {path === '/review' && dueCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none shadow">
                        {dueCount > 99 ? '99+' : dueCount}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-[11px] font-semibold tracking-tight">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function DashboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
    </svg>
  );
}

function LibraryIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ReviewIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function StatsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
