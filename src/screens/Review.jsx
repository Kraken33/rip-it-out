import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDueCards, getImprovement, getSession, updateSrsCard, getSrsCards, logActivity } from '../store';
import { processReview } from '../srs';
import { generateExamplesPrompt } from '../prompts';

export default function Review() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExamplesPrompt, setShowExamplesPrompt] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const startTimeRef = useRef(Date.now());
  const reviewedCardsRef = useRef([]);

  const [stats, setStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0,
  });

  const [nextDue, setNextDue] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    let isMounted = true;

    async function loadCards() {
      try {
        setLoading(true);
        const due = await getDueCards();

        if (due.length > 0) {
          const hydratedQueue = (
            await Promise.all(
              due.map(async (card) => {
                const improvement = await getImprovement(card.improvementId);
                if (!improvement) return null;
                const session = await getSession(improvement.sessionId);
                return {
                  ...card,
                  improvement,
                  session,
                };
              })
            )
          ).filter(Boolean);

          if (isMounted) {
            if (hydratedQueue.length > 0) {
              setQueue(hydratedQueue);
            } else {
              await findNextDue();
            }
          }
        } else {
          if (isMounted) await findNextDue();
        }
      } catch (err) {
        console.error('Error loading review cards:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function findNextDue() {
      const allCards = await getSrsCards();
      const futureCards = allCards
        .filter((c) => new Date(c.nextReview) > new Date())
        .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
      if (futureCards.length > 0 && isMounted) {
        setNextDue(new Date(futureCards[0].nextReview));
      }
    }

    loadCards();

    return () => {
      isMounted = false;
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 0 && reviewedCardsRef.current.length > 0) {
        const lastCard = reviewedCardsRef.current[reviewedCardsRef.current.length - 1];
        logActivity({
          type: 'review',
          durationSeconds: elapsed,
          sessionId: lastCard?.session?.id || null,
          topicId: lastCard?.session?.topicId || null,
        });
      }
    };
  }, []);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleRating = async (score) => {
    const currentCard = queue[currentIndex];
    reviewedCardsRef.current.push(currentCard);

    const updates = processReview(currentCard, score);
    await updateSrsCard(currentCard.improvementId, updates);

    const statKeys = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
    const key = statKeys[score];
    if (key) {
      setStats((prev) => ({
        ...prev,
        [key]: prev[key] + 1,
        total: prev.total + 1,
      }));
    }

    let newQueue = [...queue];

    if (score === 1) {
      newQueue.push({ ...currentCard, ...updates });
      setQueue(newQueue);
    }

    setShowAnswer(false);
    setShowExamplesPrompt(false);

    if (currentIndex + 1 >= newQueue.length) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 0) {
        await logActivity({
          type: 'review',
          durationSeconds: elapsed,
          sessionId: currentCard?.session?.id || null,
          topicId: currentCard?.session?.topicId || null,
        });
        startTimeRef.current = Date.now();
        reviewedCardsRef.current = [];
      }
      setSessionComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCopyExamples = async () => {
    const currentCard = queue[currentIndex];
    const prompt = generateExamplesPrompt([currentCard.improvement]);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="text-[var(--text-muted)] animate-pulse">Loading cards...</div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-scale-in">
        <div className="glass rounded-xl p-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Session Complete! 🎯</h2>
          <div className="text-[var(--text-secondary)] text-lg">
            You reviewed {stats.total} cards today.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)]">
              <div className="text-[var(--danger)] font-bold text-2xl">{stats.again}</div>
              <div className="text-sm text-[var(--text-muted)]">Again</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)]">
              <div className="text-[var(--warning)] font-bold text-2xl">{stats.hard}</div>
              <div className="text-sm text-[var(--text-muted)]">Hard</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)]">
              <div className="text-[var(--success)] font-bold text-2xl">{stats.good}</div>
              <div className="text-sm text-[var(--text-muted)]">Good</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)]">
              <div className="text-[var(--accent)] font-bold text-2xl">{stats.easy}</div>
              <div className="text-sm text-[var(--text-muted)]">Easy</div>
            </div>
          </div>

          <div className="pt-4">
            <Link to="/" className="inline-flex items-center px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] border border-[var(--border-subtle)] rounded-lg transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass rounded-xl p-10 text-center space-y-6 w-full">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">You're all caught up! 🎉</h2>
          <div className="text-[var(--text-secondary)] text-lg">
            No cards are due for review right now.
          </div>
          {nextDue && (
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] max-w-sm mx-auto">
              <div className="text-sm text-[var(--text-muted)]">Next card due</div>
              <div className="text-[var(--text-primary)] font-medium mt-1">
                {nextDue.toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          )}
          <div className="pt-4">
            <Link to="/" className="inline-flex items-center px-6 py-3 bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)] glow rounded-lg transition-colors font-medium">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div className="w-full space-y-6 animate-fade-in py-2 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Review Mode</span>
          <span>Card {currentIndex + 1} of {queue.length}</span>
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div 
            className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, ((currentIndex) / queue.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 flex flex-col min-h-[380px] shadow-xl relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-4">
          <div className="text-purple-400 text-xs font-bold tracking-wider uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            {currentCard.session?.title || "Session Phrase"}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Target Construction</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-purple-300 text-glow leading-relaxed max-w-lg">
              "{currentCard.improvement.construction || currentCard.improvement.improved}"
            </h3>
          </div>
          <div className="text-xs text-gray-400 italic bg-black/40 px-3.5 py-1.5 rounded-lg border border-gray-800/80">
            Original phrasing: <span className="line-through text-rose-400 font-medium">"{currentCard.improvement.original}"</span>
          </div>
        </div>

        {showAnswer ? (
          <div className="animate-fade-in border-t border-gray-800 pt-6 space-y-6 flex flex-col">
            <div className="text-center space-y-3">
              <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Example & Natural Usage</div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed">
                "{currentCard.improvement.improved}"
              </h3>
              {currentCard.improvement.explanation && (
                <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-1">
                  {currentCard.improvement.explanation}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center pt-1">
              <button 
                onClick={() => setShowExamplesPrompt(!showExamplesPrompt)}
                className="px-4 py-2 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                ✨ Get Example Sentences (Prompt #4)
              </button>

              {showExamplesPrompt && (
                <div className="mt-4 w-full p-4 bg-gray-900 border border-gray-800 rounded-lg text-left animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Prompt #4 (Examples)</span>
                    <button 
                      onClick={handleCopyExamples}
                      className="text-xs px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-colors cursor-pointer"
                    >
                      {copied ? 'Copied! ✓' : 'Copy Prompt'}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto rounded bg-black/60 p-3 border border-gray-800 leading-relaxed">
                    {generateExamplesPrompt([currentCard.improvement])}
                  </pre>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button 
                id="btn-rate-again"
                onClick={() => handleRating(1)}
                className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-rose-950/40 hover:border-rose-500 transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="font-bold text-rose-400 text-base">Again</div>
                <div className="text-[10px] text-gray-500 font-medium">&lt; 1 min</div>
              </button>
              <button 
                id="btn-rate-hard"
                onClick={() => handleRating(2)}
                className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-amber-950/40 hover:border-amber-500 transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="font-bold text-amber-400 text-base">Hard</div>
                <div className="text-[10px] text-gray-500 font-medium">Few days</div>
              </button>
              <button 
                id="btn-rate-good"
                onClick={() => handleRating(3)}
                className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-emerald-950/40 hover:border-emerald-500 transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="font-bold text-emerald-400 text-base">Good</div>
                <div className="text-[10px] text-gray-500 font-medium">Standard</div>
              </button>
              <button 
                id="btn-rate-easy"
                onClick={() => handleRating(4)}
                className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-purple-950/40 hover:border-purple-500 transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="font-bold text-purple-400 text-base">Easy</div>
                <div className="text-[10px] text-gray-500 font-medium">Much later</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex justify-center pt-6 pb-2 w-full">
            <button
              id="btn-start-review"
              onClick={handleShowAnswer}
              className="w-full max-w-sm py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Show Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
