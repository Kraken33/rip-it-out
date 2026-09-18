import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  getImprovements, 
  getSessions, 
  getSrsCards, 
  deleteImprovement, 
  resetSrsCard 
} from '../store';
import { formatNextReview } from '../srs';

function Badge({ children, type = 'default' }) {
  const baseClasses = "text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border";
  const typeClasses = {
    default: "bg-gray-800 text-gray-300 border-gray-700",
    primary: "bg-purple-950/60 text-purple-300 border-purple-500/40",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
    warning: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    danger: "bg-rose-950/60 text-rose-300 border-rose-500/40",
  };
  return <span className={`${baseClasses} ${typeClasses[type] || typeClasses.default}`}>{children}</span>;
}

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSession = searchParams.get('session') || 'all';

  const [improvements, setImprovements] = useState([]);
  const [srsCards, setSrsCards] = useState({});
  const [sessions, setSessions] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState(initialSession);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [srsFilter, setSrsFilter] = useState('all');
  const [freqFilter, setFreqFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const loadData = useCallback(() => {
    setImprovements(getImprovements());
    setSessions(getSessions());
    
    const cards = getSrsCards();
    const cardMap = {};
    cards.forEach(c => { cardMap[c.improvementId] = c; });
    setSrsCards(cardMap);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (sessionFilter === 'all') {
      searchParams.delete('session');
    } else {
      searchParams.set('session', sessionFilter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [sessionFilter, searchParams, setSearchParams]);

  const handleDelete = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this phrase?')) {
      deleteImprovement(id);
      loadData();
    }
  }, [loadData]);

  const handleResetSrs = useCallback((id) => {
    if (window.confirm('Reset SRS progress for this phrase?')) {
      resetSrsCard(id);
      loadData();
    }
  }, [loadData]);

  const filteredAndSorted = useMemo(() => {
    let result = [...improvements];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        i => (i.construction && i.construction.toLowerCase().includes(q)) ||
             (i.original && i.original.toLowerCase().includes(q)) || 
             (i.improved && i.improved.toLowerCase().includes(q)) || 
             (i.explanation && i.explanation.toLowerCase().includes(q))
      );
    }

    if (sessionFilter !== 'all') {
      result = result.filter(i => i.sessionId === sessionFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }

    if (freqFilter !== 'all') {
      result = result.filter(i => i.spokenFrequency === freqFilter);
    }

    if (srsFilter !== 'all') {
      result = result.filter(i => srsCards[i.id]?.status === srsFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'next_review_asc') {
        const dateA = new Date(srsCards[a.id]?.nextReview || 0);
        const dateB = new Date(srsCards[b.id]?.nextReview || 0);
        return dateA - dateB;
      } else if (sortBy === 'ease_asc') {
        const easeA = srsCards[a.id]?.easeFactor || 2.5;
        const easeB = srsCards[b.id]?.easeFactor || 2.5;
        return easeA - easeB;
      }
      return 0;
    });

    return result;
  }, [improvements, search, sessionFilter, categoryFilter, freqFilter, srsFilter, sortBy, srsCards]);

  const categoryOptions = ['all', 'grammar', 'vocabulary', 'collocation', 'idiom', 'pronunciation', 'structure'];
  const srsOptions = ['all', 'new', 'learning', 'reviewing', 'mature'];
  const freqOptions = ['all', 'very_high', 'high', 'medium'];

  const formatOption = (opt) => {
    if (opt === 'all') return 'All';
    return opt.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSrsBadgeType = (status) => {
    switch (status) {
      case 'new': return 'primary';
      case 'learning': return 'warning';
      case 'reviewing': return 'success';
      case 'mature': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-3xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Phrase Library</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'phrase stored' : 'phrases in vault'}
          </p>
        </div>
        <Link 
          to="/session/new"
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors text-center cursor-pointer shadow"
        >
          + New Session
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Search phrases or explanations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {filtersExpanded ? 'Hide Filters ▲' : 'Show Filters ▼'}
          </button>
        </div>

        {filtersExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-800 animate-fade-in">
            {/* Session Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session</label>
              <select 
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="date_desc">Date Added (Newest)</option>
                <option value="next_review_asc">Next Review (Soonest)</option>
                <option value="ease_asc">Ease Factor (Hardest)</option>
              </select>
            </div>

            {/* Category Pills */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categoryOptions.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-colors cursor-pointer ${
                      categoryFilter === cat 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {formatOption(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* SRS Status Pills */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SRS Status</label>
              <div className="flex flex-wrap gap-1.5">
                {srsOptions.map(srs => (
                  <button
                    key={srs}
                    onClick={() => setSrsFilter(srs)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-colors cursor-pointer ${
                      srsFilter === srs 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {formatOption(srs)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Improvements List */}
      {improvements.length === 0 ? (
        <div className="text-center py-16 glass-panel p-6 space-y-3">
          <div className="text-4xl">📚</div>
          <h2 className="text-lg font-bold text-white">Your phrase library is empty</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You haven't added any phrases yet. Create a session to extract spoken improvements from your LLM!
          </p>
          <div className="pt-2">
            <Link 
              to="/session/new"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow"
            >
              Create First Session
            </Link>
          </div>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 glass-panel p-6 space-y-2">
          <p className="text-sm text-gray-400">No phrases match your current filters.</p>
          <button 
            onClick={() => {
              setSearch('');
              setSessionFilter('all');
              setCategoryFilter('all');
              setSrsFilter('all');
              setFreqFilter('all');
            }}
            className="text-purple-400 hover:underline text-xs font-bold cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map((item) => {
            const srsCard = srsCards[item.id];
            return (
              <div key={item.id} className="glass-panel p-5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3 items-start">
                  <div className="space-y-1 flex-1">
                    <p className="text-lg font-extrabold text-purple-300 text-glow leading-snug">
                      "{item.construction || item.improved}"
                    </p>
                    <p className="text-xs text-emerald-400 font-medium">
                      Example: "{item.improved}"
                    </p>
                    <p className="text-xs text-rose-400 line-through opacity-80 pt-0.5">
                      Original: "{item.original}"
                    </p>
                    {item.explanation && (
                      <p className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-lg border border-gray-800 leading-relaxed mt-2">
                        <span className="font-bold text-white">Why: </span>{item.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-1.5 flex-wrap items-start sm:items-end shrink-0">
                    <Badge>{formatOption(item.category)}</Badge>
                    <Badge>{formatOption(item.spokenFrequency)} freq</Badge>
                    {srsCard && (
                      <Badge type={getSrsBadgeType(srsCard.status)}>
                        {formatOption(srsCard.status)} • {formatNextReview(srsCard.nextReview)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                  <button
                    onClick={() => handleResetSrs(item.id)}
                    className="text-[11px] font-bold px-3 py-1 rounded bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors cursor-pointer"
                  >
                    Reset SRS
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-[11px] font-bold px-3 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
