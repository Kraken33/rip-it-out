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
import { RATINGS } from '../srs';
import AudioPlayerButton from '../components/AudioPlayerButton';
import ExplainPracticeModal from '../components/ExplainPracticeModal';
import PracticeHeader from '../components/PracticeHeader';

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
        const prog = await getFrequencyProgress();
        if (isMounted) {
          setSettings(st);
          setCurrentPage(prog?.pageNumber || prog?.page || 1);
          setCurrentIndex(prog?.sentenceIndex || 0);
          setStats({
            completed: prog?.completedCount || 0,
            skipped: prog?.skippedCount || 0,
            saved: prog?.savedCount || 0,
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
        pageNumber: page,
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
    <div className="w-full max-w-2xl mx-auto space-y-5 py-2 animate-fade-in" data-testid="frequency-practice-screen">
      {/* Unified Practice Navigation Header */}
      <PracticeHeader
        activeMode="frequency"
        rightContent={
          <>
            <button
              type="button"
              data-testid="jump-page-button"
              onClick={() => setShowJumpModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Jump to another page"
            >
              <span>Page {currentPage}</span>
              <span className="text-[10px] opacity-70">▾</span>
            </button>

            <button
              type="button"
              data-testid="direction-toggle-button"
              onClick={() => setDirection((d) => (d === 'ru-en' ? 'en-ru' : 'ru-en'))}
              className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold transition-all cursor-pointer"
              title="Toggle prompt direction"
            >
              {direction === 'ru-en' ? '🇷🇺 RU → 🇬🇧 EN' : '🇬🇧 EN → 🇷🇺 RU'}
            </button>

            <span className="hidden sm:inline-block text-[11px] text-gray-400 font-medium">
              {stats.completed} done ({stats.saved} SRS)
            </span>
          </>
        }
      />

      {/* Jump Page Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full space-y-4 border border-purple-500/30 bg-[#151622]">
            <h3 className="text-lg font-bold text-white">Jump to Manythings Page</h3>
            <p className="text-xs text-gray-400">
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
                className="w-full px-3 py-2 bg-[#0e0f17] border border-gray-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJumpModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg cursor-pointer"
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
        <div className="glass-panel p-12 text-center rounded-2xl border border-gray-800 space-y-3 min-h-[320px] flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
          <p className="text-sm font-medium text-purple-200">
            Streaming frequency sentences from Manythings page {currentPage}...
          </p>
        </div>
      )}

      {/* Error state */}
      {!pageLoading && pageError && (
        <div className="glass-panel p-8 text-center rounded-2xl border border-rose-500/30 space-y-4">
          <div className="text-rose-400 font-bold text-base">⚠️ {pageError}</div>
          <p className="text-xs text-gray-400">
            Could not retrieve sentences from manythings.org. Make sure your internet connection is active.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadPage(currentPage)}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md cursor-pointer"
            >
              Retry Page {currentPage}
            </button>
            <button
              type="button"
              onClick={() => setShowJumpModal(true)}
              className="px-4 py-2 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg cursor-pointer border border-gray-700"
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
            <p className="text-sm text-gray-400">
              You reviewed all {sentences.length} frequency sentences on this page.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center py-2">
            <div className="bg-[#0e0f17] p-3 rounded-xl border border-gray-800">
              <div className="text-xl font-bold text-white">{stats.completed}</div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Done</div>
            </div>
            <div className="bg-[#0e0f17] p-3 rounded-xl border border-gray-800">
              <div className="text-xl font-bold text-emerald-400">{stats.skipped}</div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Skipped (Easy)</div>
            </div>
            <div className="bg-[#0e0f17] p-3 rounded-xl border border-gray-800">
              <div className="text-xl font-bold text-purple-400">{stats.saved}</div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Saved to SRS</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={handleNextPage}
              className="px-6 py-3 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Start Page {currentPage + 1} →
            </button>
            <Link
              to="/review"
              className="px-5 py-3 font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700"
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
            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Card {currentIndex + 1} of {sentences.length}</span>
              <span>{Math.round(((currentIndex + 1) / sentences.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/60">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, ((currentIndex + 1) / sentences.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flashcard container */}
          <div
            className={`glass-panel p-6 sm:p-8 rounded-2xl border flex flex-col justify-between min-h-[340px] transition-all shadow-xl ${
              revealed ? 'border-purple-500/40 bg-[#151622]/90' : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            {/* Front Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
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
              <div className="border-t border-gray-800/80 pt-6 space-y-6 animate-fade-in">
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

                {/* Rating buttons conforming to unified RATINGS palette */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {RATINGS.map((r) => (
                    <button
                      key={r.score}
                      id={`btn-rate-${r.label.toLowerCase()}`}
                      type="button"
                      onClick={() => handleRate(r.score)}
                      className={`p-3 rounded-xl border border-gray-800 bg-[#0e0f17] hover:border-gray-700 transition flex flex-col items-center justify-center cursor-pointer ${
                        r.score === 1
                          ? 'hover:border-rose-500/50'
                          : r.score === 2
                          ? 'hover:border-amber-500/50'
                          : r.score === 3
                          ? 'hover:border-emerald-500/50'
                          : 'hover:border-blue-500/50'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          r.score === 1
                            ? 'text-rose-400'
                            : r.score === 2
                            ? 'text-amber-400'
                            : r.score === 3
                            ? 'text-emerald-400'
                            : 'text-blue-400'
                        }`}
                      >
                        <span className="opacity-70 font-mono mr-1">{r.score}.</span>
                        {r.label}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 text-center">
                        {r.score === 1
                          ? 'Review Soon'
                          : r.score === 2
                          ? 'Add to SRS'
                          : r.score === 3
                          ? 'Add to SRS'
                          : 'Skip (Known)'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* On-demand Explain & Practice action */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExplainModal(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Reveal Translation</span>
                  <span className="text-xs text-purple-200 font-normal opacity-80">(Space)</span>
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
        direction={direction}
      />
    </div>
  );
}
