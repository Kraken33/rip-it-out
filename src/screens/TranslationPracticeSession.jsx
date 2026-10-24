import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateTranslationSentence, evaluateTranslationRound } from '../services/aiService';
import { parseTranslationVerdict } from '../prompts';
import AudioPlayerButton from '../components/AudioPlayerButton';
import AudioRecorder from '../components/AudioRecorder';
import { insertTranscriptionAtCaret } from '../components/InteractiveSessionShell';
import { RATINGS } from '../srs';

export const ITEMS_PER_ROUND = 1;

/**
 * Per-round verdict: coverage badge for the target construction, the overall
 * summary, the rewritten sentence when one is warranted, and notes only for
 * targets that were used awkwardly or not used at all.
 */
function VerdictCard({ verdict }) {
  const constructions = verdict?.constructions || [];
  const problems = constructions.filter((c) => !c.used || c.quality === 'awkward');

  const stateOf = (c) => (!c.used ? 'missing' : c.quality === 'awkward' ? 'awkward' : 'natural');

  const BADGE_STYLES = {
    natural: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
    awkward: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
    missing: 'bg-rose-950/60 text-rose-300 border-rose-700/50',
  };
  const BADGE_MARKS = { natural: '✓', awkward: '~', missing: '✗' };
  const BADGE_LABELS = { natural: 'natural', awkward: 'awkward', missing: 'not used' };

  return (
    <div
      data-testid="translation-verdict"
      className="glass-panel p-4 rounded-2xl border border-purple-500/20 w-full space-y-3"
    >
      <p className="text-sm text-gray-100 font-semibold">
        {verdict?.summary || 'Evaluation complete.'}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {constructions.map((c) => {
          const state = stateOf(c);
          return (
            <span
              key={c.target}
              data-testid="verdict-target"
              data-state={state}
              title={`${BADGE_LABELS[state]}${c.note ? ` — ${c.note}` : ''}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${BADGE_STYLES[state]}`}
            >
              <span>{BADGE_MARKS[state]}</span>
              <span>{c.target}</span>
            </span>
          );
        })}
      </div>

      {verdict?.rewriteNeeded && verdict?.rewrite && (
        <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
            Natural version of your sentence
          </p>
          <p className="text-sm text-emerald-100 leading-relaxed">{verdict.rewrite}</p>
        </div>
      )}

      {problems.length > 0 && (
        <ul className="space-y-1.5 text-xs text-gray-300">
          {problems.map((c) => (
            <li key={c.target} className="space-y-0.5">
              <span className="font-bold text-amber-300">{c.target}</span>
              {!c.used && <span className="ml-1.5 text-rose-400 font-semibold">not used</span>}
              {c.note && <p>{c.note}</p>}
              {c.better && (
                <p className="text-gray-400">
                  → <span className="text-emerald-200">{c.better}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function distinctCardCount(rounds) {
  const seen = new Set();
  (rounds || []).forEach((r) =>
    (r?.cards || []).forEach((c) => {
      if (c) seen.add(c.id ?? c.improvementId ?? c.construction);
    })
  );
  return seen.size;
}

export default function TranslationPracticeSession({
  allCards = [],
  settings = {},
  onRateCard,
  onFinish,
  onExit,
}) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const activeCardIndexRef = useRef(0);
  useEffect(() => {
    activeCardIndexRef.current = activeCardIndex;
  }, [activeCardIndex]);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const currentRoundIndexRef = useRef(0);
  useEffect(() => {
    currentRoundIndexRef.current = currentRoundIndex;
  }, [currentRoundIndex]);

  const [rounds, setRounds] = useState(() => [{ cards: allCards[0] ? [allCards[0]] : [] }]);
  const roundsRef = useRef(rounds);
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const [currentSentence, setCurrentSentence] = useState('');
  const [submittedTranslation, setSubmittedTranslation] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [unparsedFeedback, setUnparsedFeedback] = useState(null);
  const [evaluationRetryData, setEvaluationRetryData] = useState(null);

  const [inputText, setInputText] = useState('');
  const [roundLoading, setRoundLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef(null);
  const requestedRoundsRef = useRef(new Set());
  const submittedRoundsRef = useRef([]);

  // Auto-focus input when sentence loads and we are in translating mode
  useEffect(() => {
    if (!roundLoading && !evaluating && !verdict && !unparsedFeedback && !isCompleted && currentSentence) {
      inputRef.current?.focus();
    }
  }, [roundLoading, evaluating, verdict, unparsedFeedback, isCompleted, currentSentence]);

  // Load a single natural Russian sentence for the round's target construction
  const loadRoundSentence = useCallback(
    async (roundIndex, cardToPractice) => {
      if (!cardToPractice) return;
      setRoundLoading(true);
      setErrorMsg('');
      setCurrentSentence('');
      setSubmittedTranslation('');
      setVerdict(null);
      setUnparsedFeedback(null);
      setEvaluationRetryData(null);
      setInputText('');

      try {
        const reply = await generateTranslationSentence(cardToPractice, settings);
        const sentence =
          typeof reply === 'object' && reply !== null
            ? reply.sentence || reply.passage || ''
            : String(reply || '');

        setRounds((prev) => {
          const next = [...prev];
          while (next.length <= roundIndex) {
            next.push({ cards: [] });
          }
          next[roundIndex] = { ...next[roundIndex], cards: [cardToPractice] };
          return next;
        });

        setCurrentSentence(sentence);
      } catch (err) {
        requestedRoundsRef.current.delete(roundIndex);
        setErrorMsg(err.message || 'Failed to load sentence from AI.');
      } finally {
        setRoundLoading(false);
      }
    },
    [settings]
  );

  // Initial round generation
  useEffect(() => {
    if (!allCards || allCards.length === 0) return;
    if (requestedRoundsRef.current.has(0)) return;
    requestedRoundsRef.current.add(0);

    loadRoundSentence(0, allCards[0]);
  }, [allCards, loadRoundSentence]);

  const requestVerdict = async (
    roundIndex,
    sentenceText,
    translationText,
    roundCard
  ) => {
    setEvaluating(true);
    setErrorMsg('');

    try {
      const raw = await evaluateTranslationRound([roundCard], sentenceText, translationText, settings);
      const parsed = parseTranslationVerdict(raw);

      if (parsed.success) {
        setVerdict(parsed.verdict);
        setUnparsedFeedback(null);
        setEvaluationRetryData(null);
      } else {
        setVerdict(null);
        setUnparsedFeedback(raw.trim());
        setEvaluationRetryData({ sentenceText, translation: translationText, roundCard, roundIndex });
      }

      submittedRoundsRef.current = submittedRoundsRef.current.filter(
        (r) => r.roundIndex !== roundIndex
      );
      submittedRoundsRef.current.push({
        roundIndex,
        cards: [roundCard],
        passageText: sentenceText,
        translationText,
        evaluatedAt: new Date().toISOString(),
        verdict: parsed.success ? parsed.verdict : null,
        rawFeedback: parsed.success ? '' : raw.trim(),
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to evaluate the translation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendTranslation = () => {
    const text = inputText.trim();
    if (!text || evaluating || roundLoading || isCompleted) return;

    const roundIndex = currentRoundIndexRef.current;
    const sentenceText = currentSentence;
    const roundCard =
      roundsRef.current[roundIndex]?.cards?.[0] || allCards[activeCardIndexRef.current];

    setErrorMsg('');
    setSubmittedTranslation(text);
    setInputText('');
    requestVerdict(roundIndex, sentenceText, text, roundCard);
  };

  const handleRetryEvaluation = () => {
    if (evaluating || !evaluationRetryData) return;
    const { sentenceText, translation, roundCard, roundIndex } = evaluationRetryData;
    requestVerdict(roundIndex, sentenceText, translation, roundCard);
  };

  const handleNextRound = () => {
    if (evaluating || roundLoading || isCompleted) return;
    const nextCardIndex = activeCardIndexRef.current + 1;
    if (nextCardIndex < allCards.length) {
      activeCardIndexRef.current = nextCardIndex;
      setActiveCardIndex(nextCardIndex);
      const nextCard = allCards[nextCardIndex];
      const nextRoundIndex = currentRoundIndexRef.current + 1;
      currentRoundIndexRef.current = nextRoundIndex;
      setCurrentRoundIndex(nextRoundIndex);
      requestedRoundsRef.current.add(nextRoundIndex);
      loadRoundSentence(nextRoundIndex, nextCard);
    } else {
      setIsCompleted(true);
    }
  };

  const handleGenerateAnotherSentence = () => {
    if (evaluating || roundLoading || isCompleted) return;
    const sameCard = allCards[activeCardIndexRef.current];
    const nextRoundIndex = currentRoundIndexRef.current + 1;
    currentRoundIndexRef.current = nextRoundIndex;
    setCurrentRoundIndex(nextRoundIndex);
    requestedRoundsRef.current.add(nextRoundIndex);
    loadRoundSentence(nextRoundIndex, sameCard);
  };

  const handleRateRecall = async (score) => {
    const currentCard = allCards[activeCardIndexRef.current];
    if (onRateCard && currentCard) {
      await onRateCard(currentCard, score);
    }

    const nextCardIndex = activeCardIndexRef.current + 1;
    if (nextCardIndex < allCards.length) {
      activeCardIndexRef.current = nextCardIndex;
      setActiveCardIndex(nextCardIndex);
      const nextCard = allCards[nextCardIndex];
      const nextRoundIndex = currentRoundIndexRef.current + 1;
      currentRoundIndexRef.current = nextRoundIndex;
      setCurrentRoundIndex(nextRoundIndex);
      requestedRoundsRef.current.add(nextRoundIndex);
      loadRoundSentence(nextRoundIndex, nextCard);
    } else {
      setIsCompleted(true);
      handleFinishSession({ ratedInline: true });
    }
  };

  // Keyboard shortcut for recall rating 1..4 when in evaluated view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!verdict && !unparsedFeedback) return;
      if (evaluating || roundLoading || isCompleted) return;

      if (e.key === '1') handleRateRecall(1);
      else if (e.key === '2') handleRateRecall(2);
      else if (e.key === '3') handleRateRecall(3);
      else if (e.key === '4') handleRateRecall(4);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleFinishSession = (options) => {
    if (!onFinish) return;
    const orderedRounds = [...submittedRoundsRef.current].sort(
      (a, b) => a.roundIndex - b.roundIndex
    );
    const seen = new Set();
    const practicedImprovements = [];
    orderedRounds.forEach((r) =>
      (r.cards || []).forEach((c) => {
        const key = c.id ?? c.improvementId ?? c.construction;
        if (key && !seen.has(key)) {
          seen.add(key);
          practicedImprovements.push(c);
        }
      })
    );
    if (options && Object.keys(options).length > 0) {
      onFinish(orderedRounds, practicedImprovements, options);
    } else {
      onFinish(orderedRounds, practicedImprovements);
    }
  };

  const currentCard = allCards[activeCardIndex] || null;
  const isEvaluated = Boolean(verdict || unparsedFeedback);
  const progressPercent = allCards.length > 0 ? ((activeCardIndex + 1) / allCards.length) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 py-2 animate-fade-in" data-testid="translation-practice-card">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              ← Exit
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <span>🌐</span>
            <span>Round {currentRoundIndex + 1}</span>
          </span>
          <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
            {distinctCardCount(rounds.slice(0, currentRoundIndex + 1))} practiced
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNextRound}
            disabled={evaluating || roundLoading || isCompleted || activeCardIndex >= allCards.length - 1}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-lg border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
          >
            Next Round →
          </button>
          <button
            id="btn-finish-translation-practice"
            type="button"
            onClick={() => handleFinishSession()}
            disabled={evaluating}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer disabled:opacity-50"
          >
            Finish & Rate Recall →
          </button>
        </div>
      </div>

      {/* Card Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Card {activeCardIndex + 1} of {allCards.length}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/60">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex justify-between items-center">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-400 hover:text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Single Card Panel */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-xl flex flex-col justify-between min-h-[360px] space-y-6">
        {/* Card Header & Russian Sentence */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 my-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Russian Sentence to Translate
          </span>

          {roundLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                Generating Russian sentence for practice...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed">
                {currentSentence || 'Sentence loading...'}
              </h3>
              {currentSentence && (
                <AudioPlayerButton text={currentSentence} settings={settings} size="sm" />
              )}
            </div>
          )}
        </div>

        {/* Translation Input Phase (when not evaluated) */}
        {!isEvaluated && !roundLoading && (
          <div className="space-y-4 border-t border-gray-800/80 pt-5">
            {evaluating && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[95%]">
                  <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tr-sm text-sm sm:text-base leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                    <p className="whitespace-pre-wrap">{submittedTranslation}</p>
                  </div>
                </div>

                <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 w-full">
                  <p
                    data-testid="evaluating-indicator"
                    className="text-sm text-gray-400 font-medium animate-pulse"
                  >
                    Evaluating your translation…
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  rows={3}
                  autoFocus
                  disabled={isCompleted || evaluating}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendTranslation();
                    }
                  }}
                  placeholder={
                    isCompleted
                      ? 'Session complete! Click Finish & Rate Recall above.'
                      : 'Type or speak your English translation...'
                  }
                  className="w-full p-3.5 pr-14 rounded-xl bg-[#0e0f17] border border-gray-800 text-white text-base focus:outline-none focus:border-purple-500 transition-all resize-none"
                />
                <div className="absolute right-2.5 bottom-3.5">
                  <AudioRecorder
                    settings={settings}
                    language="en"
                    onTranscribed={(transcription) => {
                      const nextText = insertTranscriptionAtCaret(inputRef.current, inputText, transcription);
                      setInputText(nextText);
                    }}
                    onError={(err) => setErrorMsg(err)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-gray-500 hidden sm:inline">
                  Enter adds a new line · Ctrl/⌘ + Enter translates
                </span>

                <button
                  type="button"
                  onClick={handleSendTranslation}
                  disabled={!inputText.trim() || evaluating || isCompleted}
                  className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <span>Translate ▶</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evaluated Phase: Verdict, Context, Retry & Rating */}
        {isEvaluated && !roundLoading && (
          <div className="space-y-6 border-t border-gray-800/80 pt-5 animate-fade-in">
            {/* User Translation Display */}
            <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[95%]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                Your Translation
              </span>
              <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tr-sm text-sm sm:text-base leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                <p className="whitespace-pre-wrap">{submittedTranslation}</p>
              </div>
            </div>

            {/* Verdict Display */}
            {verdict && <VerdictCard verdict={verdict} />}

            {/* Unparsed Fallback */}
            {unparsedFeedback && (
              <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm border border-amber-500/30 w-full space-y-2">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {unparsedFeedback}
                </p>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Structured evaluation unavailable — showing the raw feedback.
                  </span>
                  <button
                    type="button"
                    onClick={handleRetryEvaluation}
                    disabled={evaluating}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg transition cursor-pointer disabled:opacity-50"
                  >
                    Retry evaluation ↻
                  </button>
                </div>
              </div>
            )}

            {/* Target Construction Details */}
            {currentCard && (
              <div className="p-4 rounded-xl bg-[#0e0f17] border border-gray-800 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    Target Construction: "{currentCard.construction || currentCard.improved}"
                  </span>
                  {currentCard.improved && (
                    <AudioPlayerButton text={currentCard.improved} settings={settings} size="sm" />
                  )}
                </div>
                {currentCard.improved && (
                  <div className="text-xs text-emerald-400 font-medium">
                    "{currentCard.improved}"
                  </div>
                )}
                {currentCard.original && (
                  <div className="text-xs text-rose-400/80 line-through">
                    "{currentCard.original}"
                  </div>
                )}
                {currentCard.explanation && (
                  <p className="text-xs text-gray-400 italic pt-1 border-t border-gray-800/80">
                    {currentCard.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Inline Action Bar: Generate Another Sentence or Rate Recall */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <span className="text-xs text-gray-400">
                  Need more practice on this construction?
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAnotherSentence}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>Generate Another Sentence</span>
                </button>
              </div>

              {/* Recall Rating Buttons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <span>Rate your recall to advance:</span>
                  <span className="text-[10px] text-gray-500 hidden sm:inline">(Keys 1–4)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {RATINGS.map((r) => (
                    <button
                      key={r.score}
                      id={`btn-rate-${r.label.toLowerCase()}`}
                      type="button"
                      onClick={() => handleRateRecall(r.score)}
                      className="p-3 rounded-xl bg-[#151622] border border-gray-800 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-0.5"
                    >
                      <span className="font-bold text-xs sm:text-sm" style={{ color: r.color }}>
                        {r.score}. {r.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {r.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Banner */}
        {isCompleted && (
          <div
            data-testid="session-completed-banner"
            className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-3"
          >
            <p className="text-base font-bold text-emerald-300">
              🎉 All target constructions practiced!
            </p>
            <p className="text-xs text-gray-300">
              You've completed all constructions in this session. Ready to rate your recall?
            </p>
            <button
              type="button"
              onClick={() => handleFinishSession({ ratedInline: true })}
              className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Finish & Rate Recall →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
