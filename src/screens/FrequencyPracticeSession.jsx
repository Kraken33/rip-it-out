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
import {
  generateFrequencyMiniDrill,
  evaluateFrequencyMiniDrill,
} from '../services/aiService';
import AudioPlayerButton from '../components/AudioPlayerButton';
import AudioRecorder from '../components/AudioRecorder';

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

  // Mini-drill state (when Hard or Again is selected)
  const [inDrill, setInDrill] = useState(false);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);
  const [drillSentence, setDrillSentence] = useState(null);
  const [previousDrills, setPreviousDrills] = useState([]);
  const [userAttempt, setUserAttempt] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

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
    setInDrill(false);
    setEvaluation(null);
    setDrillSentence(null);

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

  // Advance to next sentence on this page, or complete the page
  const advanceToNext = useCallback(() => {
    setRevealed(false);
    setInDrill(false);
    setEvaluation(null);
    setDrillSentence(null);
    setUserAttempt('');
    setPreviousDrills([]);

    const nextIdx = currentIndex + 1;
    updateProgress(currentPage, nextIdx, stats);
  }, [currentIndex, currentPage, stats, updateProgress]);

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

    // HARD (2) or AGAIN (1): Save to SRS and start interactive AI drill
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
    setStats(nextStats);
    saveFrequencyProgress({
      page: currentPage,
      sentenceIndex: currentIndex,
      completedCount: nextStats.completed,
      skippedCount: nextStats.skipped,
      savedCount: nextStats.saved,
    });

    // Launch Drill
    setInDrill(true);
    triggerDrillGeneration(currentSentence, []);
  };

  const triggerDrillGeneration = async (target, pastDrills) => {
    setDrillLoading(true);
    setDrillError(null);
    setEvaluation(null);
    setUserAttempt('');

    try {
      const generated = await generateFrequencyMiniDrill(target, settings, pastDrills);
      setDrillSentence(generated);
      setPreviousDrills((prev) => [...prev, generated]);
    } catch (err) {
      console.error('Failed to generate drill sentence:', err);
      setDrillError(err.message || 'Could not generate a drill. Check your OpenAI API key in Settings.');
    } finally {
      setDrillLoading(false);
    }
  };

  const handleSubmitDrillAttempt = async (e) => {
    if (e) e.preventDefault();
    if (!userAttempt.trim() || evaluating) return;

    setEvaluating(true);
    setDrillError(null);

    try {
      const result = await evaluateFrequencyMiniDrill(
        {
          targetRu: drillSentence?.ru || currentSentence?.ru,
          targetEn: drillSentence?.en || currentSentence?.en,
          userAttempt: userAttempt.trim(),
        },
        settings
      );
      setEvaluation(result);
    } catch (err) {
      console.error('Drill evaluation failed:', err);
      setDrillError(err.message || 'Failed to evaluate translation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRateRef = useRef(handleRate);
  useEffect(() => {
    handleRateRef.current = handleRate;
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (!inDrill) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          setRevealed((prev) => !prev);
        } else if (revealed) {
          if (e.key === '1') handleRateRef.current?.(1);
          else if (e.key === '2') handleRateRef.current?.(2);
          else if (e.key === '3') handleRateRef.current?.(3);
          else if (e.key === '4') handleRateRef.current?.(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, inDrill]);

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
  const promptLang = direction === 'ru-en' ? 'ru-RU' : 'en-US';
  const answerLang = direction === 'ru-en' ? 'en-US' : 'ru-RU';

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

      {/* Active Card View (when not complete and not in drill) */}
      {!pageLoading && !pageError && currentSentence && !inDrill && (
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
                    <span className="text-[10px] text-rose-400/80 font-normal">Mini-Drill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(2)}
                    className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
                  >
                    <span className="text-amber-400 font-mono text-[10px]">2</span>
                    <span>Hard</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">Mini-Drill</span>
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

      {/* Interactive AI Mini-Drill View (when in drill mode) */}
      {inDrill && (
        <div
          data-testid="interactive-mini-drill"
          className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 space-y-6 shadow-2xl animate-fade-in"
        >
          {/* Drill header */}
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-300">⚡ Interactive AI Mini-Drill</span>
              <span className="text-[11px] text-slate-400">Reinforcing pattern</span>
            </div>
            <button
              type="button"
              onClick={advanceToNext}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Skip drill →
            </button>
          </div>

          {/* Original sentence reference */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-400">Original Sentence:</div>
            <div className="flex justify-between items-center">
              <span>🇷🇺 {currentSentence?.ru}</span>
              <span className="text-slate-400">🇬🇧 {currentSentence?.en}</span>
            </div>
          </div>

          {/* Drill loading */}
          {drillLoading && (
            <div className="p-8 text-center space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-purple-400 mx-auto" />
              <p className="text-xs text-purple-300">AI is crafting a similar practice sentence...</p>
            </div>
          )}

          {/* Drill error */}
          {drillError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-300 text-xs space-y-2">
              <p className="font-bold">⚠️ {drillError}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerDrillGeneration(currentSentence, previousDrills)}
                  className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                >
                  Retry Drill
                </button>
                <button
                  type="button"
                  onClick={advanceToNext}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  Continue to Next Sentence
                </button>
              </div>
            </div>
          )}

          {/* Drill content */}
          {!drillLoading && drillSentence && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">
                  Translate to English
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h4 className="text-2xl font-extrabold text-white leading-relaxed">
                    "{drillSentence.ru}"
                  </h4>
                  <AudioPlayerButton text={drillSentence.ru} settings={settings} size="sm" />
                </div>
                {drillSentence.hint && (
                  <p className="text-xs text-slate-400 italic">💡 Hint: {drillSentence.hint}</p>
                )}
              </div>

              {/* Translation Input & Mic */}
              {!evaluation ? (
                <form onSubmit={handleSubmitDrillAttempt} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={userAttempt}
                      onChange={(e) => setUserAttempt(e.target.value)}
                      placeholder="Type your English translation or tap the microphone..."
                      className="w-full p-3.5 pr-14 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-all resize-none"
                    />
                    <div className="absolute right-2.5 bottom-3.5">
                      <AudioRecorder
                        settings={settings}
                        onTranscribed={(text) => setUserAttempt((prev) => (prev ? `${prev} ${text}` : text))}
                        onError={(err) => setDrillError(err)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={evaluating || !userAttempt.trim()}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
                    >
                      {evaluating ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Check Translation</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Evaluation Result Display */
                <div className="space-y-4 animate-fade-in">
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      evaluation.verdict === 'natural'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : evaluation.verdict === 'acceptable'
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span>Verdict: {evaluation.verdict}</span>
                      <span>{evaluation.isAccurate ? '✓ Accurate' : 'Needs attention'}</span>
                    </div>

                    {evaluation.naturalRewrite && (
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Natural English Phrasing:
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <p className="text-sm font-bold text-white">"{evaluation.naturalRewrite}"</p>
                          <AudioPlayerButton text={evaluation.naturalRewrite} settings={settings} size="sm" />
                        </div>
                      </div>
                    )}

                    {evaluation.explanation && (
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">{evaluation.explanation}</p>
                    )}
                  </div>

                  {/* Actions after evaluation */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => triggerDrillGeneration(currentSentence, previousDrills)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-all"
                    >
                      🔄 Try Another Drill
                    </button>
                    <button
                      type="button"
                      onClick={advanceToNext}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all"
                    >
                      Continue to Next Sentence →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
