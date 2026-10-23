import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchManythingsPage } from '../services/manythingsService';
import {
  getFrequencyProgress,
  saveFrequencyProgress,
  saveFrequencySentenceToSrs,
  getSettings,
  logActivity,
} from '../store';
import AudioPlayerButton from '../components/AudioPlayerButton';
import ExplainPracticeModal from '../components/ExplainPracticeModal';

export default function FrequencyPracticeSession() {
  const navigate = useNavigate();

  // Settings & Progress state
  const [settings, setSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ completed: 0, skipped: 0, saved: 0 });

  // Page sentences
  const [sentences, setSentences] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Flashcard review state
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState('ru-en'); // 'ru-en' | 'en-ru'
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);

  // Session-level deep study cache
  const studyCacheRef = useRef(new Map());
  const sessionStartTime = useRef(Date.now());

  // 1. Load initial settings and saved progress
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const st = await getSettings();
        const prog = getFrequencyProgress();
        if (isMounted) {
          setSettings(st);
          setCurrentPage(prog.page || 1);
          setCurrentIndex(prog.sentenceIndex || 0);
          setStats({
            completed: prog.completedCount || 0,
            skipped: prog.skippedCount || 0,
            saved: prog.savedCount || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load initial settings or progress:', err);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch page sentences whenever currentPage changes
  const loadPage = useCallback(async (pageNum) => {
    setPageLoading(true);
    setPageError(null);
    setRevealed(false);
    setShowExplainModal(false);

    try {
      const data = await fetchManythingsPage(pageNum);
      if (!data || data.length === 0) {
        throw new Error(`Page ${pageNum} returned no sentences.`);
      }
      setSentences(data);
    } catch (err) {
      console.error(`Error loading Manythings page ${pageNum}:`, err);
      setPageError(err.message || 'Failed to stream sentences from Manythings.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);

  const currentSentence = sentences[currentIndex] || null;

  // Persist progress helper
  const updateProgress = useCallback(
    (page, index, newStats) => {
      setCurrentPage(page);
      setCurrentIndex(index);
      setStats(newStats);
      saveFrequencyProgress({
        page,
        sentenceIndex: index,
        completedCount: newStats.completed,
        skippedCount: newStats.skipped,
        savedCount: newStats.saved,
      });
    },
    []
  );

  // Rating handlers
  const handleRate = async (rating) => {
    if (!currentSentence) return;

    if (rating === 4) {
      // EASY: Skip completely
      const nextStats = {
        ...stats,
        completed: stats.completed + 1,
        skipped: stats.skipped + 1,
      };
      updateProgress(currentPage, currentIndex + 1, nextStats);
      setRevealed(false);
      return;
    }

    if (rating === 3) {
      // GOOD: Save to SRS and advance immediately
      try {
        await saveFrequencySentenceToSrs(currentSentence, 3);
      } catch (err) {
        console.error('Failed to save Good sentence to SRS:', err);
      }
      const nextStats = {
        ...stats,
        completed: stats.completed + 1,
        saved: stats.saved + 1,
      };
      updateProgress(currentPage, currentIndex + 1, nextStats);
      setRevealed(false);
      return;
    }

    // HARD (2) or AGAIN (1): Save to SRS with learning status and advance immediately
    try {
      await saveFrequencySentenceToSrs(currentSentence, rating);
    } catch (err) {
      console.error('Failed to save Hard/Again sentence to SRS:', err);
    }

    const nextStats = {
      ...stats,
      completed: stats.completed + 1,
      saved: stats.saved + 1,
    };
    updateProgress(currentPage, currentIndex + 1, nextStats);
    setRevealed(false);
  };

  const handleRateRef = useRef(handleRate);
  useEffect(() => {
    handleRateRef.current = handleRate;
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea or if a modal is open
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (showJumpModal || showExplainModal) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setRevealed((prev) => !prev);
      } else if (revealed) {
        if (e.key === '1') handleRateRef.current?.(1);
        else if (e.key === '2') handleRateRef.current?.(2);
        else if (e.key === '3') handleRateRef.current?.(3);
        else if (e.key === '4') handleRateRef.current?.(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, showJumpModal, showExplainModal]);

  // Log session time on unmount
  useEffect(() => {
    const startMs = sessionStartTime.current;
    return () => {
      const elapsed = Math.round((Date.now() - startMs) / 1000);
      if (elapsed > 5) {
        logActivity({ type: 'practice', durationSeconds: elapsed });
      }
    };
  }, []);

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    updateProgress(nextPage, 0, stats);
  };

  const handleJumpPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1) {
      updateProgress(pageNum, 0, stats);
      setShowJumpModal(false);
      setJumpPageInput('');
    }
  };

  // Prompt / Answer depending on direction
  const promptText = direction === 'ru-en' ? currentSentence?.ru : currentSentence?.en;
  const answerText = direction === 'ru-en' ? currentSentence?.en : currentSentence?.ru;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 py-2 animate-fade-in" data-testid="frequency-practice-screen">
      {/* Top Header bar */}
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Link
            to="/practice"
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            ← Practice
          </Link>
          <button
            type="button"
            onClick={() => setShowJumpModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold transition-all"
            title="Jump to another page"
          >
            <span>Page {currentPage}</span>
            <span className="text-[10px] opacity-70">▾</span>
          </button>
        </div>

        {/* Direction toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDirection((d) => (d === 'ru-en' ? 'en-ru' : 'ru-en'))}
            className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold"
            title="Toggle prompt direction"
          >
            {direction === 'ru-en' ? '🇷🇺 RU → 🇬🇧 EN' : '🇬🇧 EN → 🇷🇺 RU'}
          </button>

          <span className="hidden sm:inline-block text-[11px] text-slate-500">
            {stats.completed} done ({stats.saved} SRS)
          </span>
        </div>
      </div>

      {/* Jump Page Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full space-y-4 border border-indigo-500/30">
            <h3 className="text-lg font-bold text-white">Jump to Manythings Page</h3>
            <p className="text-xs text-slate-400">
              Each page contains ~35–40 frequency-ranked sentence pairs from Tatoeba.
            </p>
            <form onSubmit={handleJumpPage} className="space-y-4">
              <input
                type="number"
                min="1"
                placeholder={`e.g. ${currentPage}`}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJumpModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg"
                >
                  Load Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading state */}
      {pageLoading && (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3 min-h-[300px] flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
          <p className="text-sm font-medium text-slate-300">
            Streaming frequency sentences from Manythings page {currentPage}...
          </p>
        </div>
      )}

      {/* Error state */}
      {!pageLoading && pageError && (
        <div className="glass-panel p-8 text-center rounded-2xl border border-rose-500/30 space-y-4">
          <div className="text-rose-400 font-bold text-base">⚠️ {pageError}</div>
          <p className="text-xs text-slate-400">
            Could not retrieve sentences from manythings.org. Make sure your internet connection is active.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadPage(currentPage)}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md"
            >
              Retry Page {currentPage}
            </button>
            <button
              type="button"
              onClick={() => setShowJumpModal(true)}
              className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              Select Different Page
            </button>
          </div>
        </div>
      )}

      {/* Page Complete state */}
      {!pageLoading && !pageError && currentIndex >= sentences.length && (
        <div className="glass-panel p-8 sm:p-10 text-center rounded-2xl border border-emerald-500/30 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-3xl border border-emerald-500/40">
            🎉
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Page {currentPage} Completed!</h2>
            <p className="text-sm text-slate-400">
              You reviewed all {sentences.length} frequency sentences on this page.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center py-2">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-white">{stats.completed}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Done</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-emerald-400">{stats.skipped}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skipped (Easy)</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xl font-bold text-indigo-400">{stats.saved}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved to SRS</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={handleNextPage}
              className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
            >
              Start Page {currentPage + 1} →
            </button>
            <Link
              to="/review"
              className="px-5 py-3 font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Review SRS Cards
            </Link>
          </div>
        </div>
      )}

      {/* Active Card View (when not complete) */}
      {!pageLoading && !pageError && currentSentence && currentIndex < sentences.length && (
        <div className="space-y-4">
          {/* Progress bar within page */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Card {currentIndex + 1} of {sentences.length}</span>
              <span>{Math.round(((currentIndex + 1) / sentences.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, ((currentIndex + 1) / sentences.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flashcard container */}
          <div
            className={`glass-panel p-6 sm:p-8 rounded-2xl border flex flex-col justify-between min-h-[320px] transition-all shadow-xl ${
              revealed ? 'border-indigo-500/40 bg-slate-900/80' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Front Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {direction === 'ru-en' ? 'Russian Sentence' : 'English Sentence'}
              </span>

              <div className="flex items-center justify-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed">
                  "{promptText}"
                </h3>
                <AudioPlayerButton text={promptText} settings={settings} size="sm" />
              </div>
            </div>

            {/* Back Answer (Revealed) */}
            {revealed ? (
              <div className="border-t border-slate-800/80 pt-6 space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    Translation
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-300 leading-relaxed">
                      "{answerText}"
                    </p>
                    <AudioPlayerButton text={answerText} settings={settings} size="sm" />
                  </div>
                </div>

                {/* Rating buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRate(1)}
                    className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-rose-400 font-mono text-[10px]">1</span>
                    <span>Again</span>
                    <span className="text-[10px] text-rose-400/80 font-normal">Review Soon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(2)}
                    className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-amber-400 font-mono text-[10px]">2</span>
                    <span>Hard</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">Add to SRS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(3)}
                    className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-indigo-400 font-mono text-[10px]">3</span>
                    <span>Good</span>
                    <span className="text-[10px] text-indigo-400/80 font-normal">Add to SRS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(4)}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-emerald-400 font-mono text-[10px]">4</span>
                    <span>Easy</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">Skip (Known)</span>
                  </button>
                </div>

                {/* On-demand Explain & Practice action */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExplainModal(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span>💡 Explain & Practice</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Reveal Translation</span>
                  <span className="text-xs text-indigo-200 font-normal opacity-80">(Space)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explain & Practice Modal */}
      <ExplainPracticeModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        sentence={currentSentence}
        settings={settings}
        cache={studyCacheRef.current}
      />
    </div>
  );
}
