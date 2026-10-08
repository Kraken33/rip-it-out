import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateTranslationSentence, evaluateTranslationRound } from '../services/aiService';
import { parseTranslationVerdict } from '../prompts';
import AudioRecorder from '../components/AudioRecorder';
import { scrollToElementBottom, useVisualViewport } from '../hooks/useVisualViewport';

// Cap the auto-grown input so the round's Russian sentence keeps its room.
const MAX_INPUT_HEIGHT = 200;

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
      className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 w-full space-y-3"
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

  // On-demand rounds of 1 target construction each
  const [rounds, setRounds] = useState(() => [{ cards: allCards[0] ? [allCards[0]] : [] }]);
  const roundsRef = useRef(rounds);
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [inputText, setInputText] = useState('');
  const [roundLoading, setRoundLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestedRoundsRef = useRef(new Set());
  const submittedRoundsRef = useRef([]);

  const messageSeqRef = useRef(0);
  const nextMessageId = (prefix) => {
    messageSeqRef.current += 1;
    return `${prefix}_${messageSeqRef.current}`;
  };

  const scrollToActivePassage = useCallback(() => {
    scrollToElementBottom(messagesEndRef.current);
  }, []);

  useVisualViewport({
    onKeyboardOpen: scrollToActivePassage,
  });

  useEffect(() => {
    scrollToActivePassage();
  }, [messages, roundLoading, evaluating, scrollToActivePassage]);

  // Grow the text area with its content, up to the cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [inputText]);

  // Load a single natural Russian sentence for the round's target construction
  const loadRoundSentence = useCallback(
    async (roundIndex, cardToPractice) => {
      if (!cardToPractice) return;
      setRoundLoading(true);
      setErrorMsg('');

      const assistantMsgId = nextMessageId(`asst_round_${roundIndex}`);
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
      ]);

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

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: sentence } : m))
        );
      } catch (err) {
        requestedRoundsRef.current.delete(roundIndex);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
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

  const currentPassageText =
    [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === 'assistant' &&
          !m.verdict &&
          !m.unparsed &&
          typeof m.content === 'string' &&
          m.content.trim()
      )?.content || '';

  const requestVerdict = async (
    verdictMsgId,
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

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== verdictMsgId) return m;
          if (parsed.success) {
            return {
              ...m,
              pending: false,
              verdict: parsed.verdict,
              unparsed: false,
              rawText: '',
              retry: null,
            };
          }
          return {
            ...m,
            pending: false,
            verdict: null,
            unparsed: true,
            rawText: raw.trim(),
            retry: { sentenceText, translation: translationText, roundCard, roundIndex },
          };
        })
      );

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

      if (parsed.success) {
        const constructions = parsed.verdict?.constructions || [];
        const isNatural =
          constructions.length > 0 &&
          constructions.every((c) => Boolean(c.used) && c.quality === 'natural');

        if (isNatural) {
          // Natural: advance card in queue
          const nextCardIndex = activeCardIndexRef.current + 1;
          activeCardIndexRef.current = nextCardIndex;
          setActiveCardIndex(nextCardIndex);

          if (nextCardIndex < allCards.length) {
            const nextCard = allCards[nextCardIndex];
            const nextRoundIndex = currentRoundIndexRef.current + 1;
            currentRoundIndexRef.current = nextRoundIndex;
            setCurrentRoundIndex(nextRoundIndex);
            requestedRoundsRef.current.add(nextRoundIndex);
            loadRoundSentence(nextRoundIndex, nextCard);
          } else {
            setIsCompleted(true);
          }
        } else {
          // Missed / awkward: retry same construction with immediate fresh sentence
          const sameCard = roundCard || allCards[activeCardIndexRef.current];
          const nextRoundIndex = currentRoundIndexRef.current + 1;
          currentRoundIndexRef.current = nextRoundIndex;
          setCurrentRoundIndex(nextRoundIndex);
          requestedRoundsRef.current.add(nextRoundIndex);
          loadRoundSentence(nextRoundIndex, sameCard);
        }
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== verdictMsgId));
      setErrorMsg(err.message || 'Failed to evaluate the translation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendTranslation = () => {
    const text = inputText.trim();
    if (!text || evaluating || roundLoading || isCompleted) return;

    const roundIndex = currentRoundIndexRef.current;
    const sentenceText = currentPassageText;
    const roundCard =
      roundsRef.current[roundIndex]?.cards?.[0] || allCards[activeCardIndexRef.current];
    const verdictMsgId = nextMessageId('asst_verdict');
    const userMsgId = nextMessageId('user');

    setErrorMsg('');
    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      },
      {
        id: verdictMsgId,
        role: 'assistant',
        content: '',
        pending: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    requestVerdict(verdictMsgId, roundIndex, sentenceText, text, roundCard);
  };

  const handleRetryEvaluation = (msg) => {
    if (evaluating || !msg?.retry) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, pending: true, unparsed: false, rawText: '' } : m))
    );
    const { sentenceText, translation, roundCard, roundIndex } = msg.retry;
    requestVerdict(msg.id, roundIndex, sentenceText, translation, roundCard);
  };

  // Dictation lands where the caret is
  const insertTranscription = (transcription) => {
    if (!transcription) return;
    const el = inputRef.current;

    setInputText((prev) => {
      const start = typeof el?.selectionStart === 'number' ? el.selectionStart : prev.length;
      const end = typeof el?.selectionEnd === 'number' ? el.selectionEnd : start;
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      const lead = before && !/\s$/.test(before) ? ' ' : '';
      const trail = after && !/^\s/.test(after) ? ' ' : '';
      return `${before}${lead}${transcription}${trail}${after}`;
    });
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

  const handleFinishSession = () => {
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
    onFinish(orderedRounds, practicedImprovements);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[82vh] min-h-0 glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in relative">
      {/* Consolidated Session Header */}
      <div className="hidden sm:flex px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
            <span>🌐</span>
            <span>Round {currentRoundIndex + 1}</span>
          </span>
          <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full shrink-0">
            {distinctCardCount(rounds.slice(0, currentRoundIndex + 1))} practiced
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="hidden sm:inline-flex px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 font-semibold transition cursor-pointer"
            >
              Exit
            </button>
          )}

          {/* Desktop Next Round */}
          <button
            type="button"
            onClick={handleNextRound}
            disabled={
              evaluating ||
              roundLoading ||
              isCompleted ||
              activeCardIndex >= allCards.length - 1
            }
            className="hidden sm:inline-flex px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
          >
            Next Round →
          </button>

          {/* Finish Practice */}
          <button
            id="btn-finish-translation-practice"
            type="button"
            onClick={handleFinishSession}
            disabled={evaluating}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            Finish & Rate Recall →
          </button>
        </div>
      </div>

      {/* Messages Thread (Full-Width Message Cards, No Robot Avatars) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#0d0e15]/50">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            if (m.verdict) {
              return (
                <div key={m.id} className="w-full">
                  <VerdictCard verdict={m.verdict} />
                </div>
              );
            }

            if (m.pending) {
              return (
                <div key={m.id} className="w-full">
                  <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 w-full">
                    <p
                      data-testid="evaluating-indicator"
                      className="text-sm text-gray-400 font-medium animate-pulse"
                    >
                      Evaluating your translation…
                    </p>
                  </div>
                </div>
              );
            }

            if (m.unparsed) {
              return (
                <div key={m.id} className="w-full">
                  <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm border border-amber-500/30 w-full space-y-2">
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {m.rawText || 'The evaluation response was empty.'}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                      <span className="text-[10px] text-amber-400 font-semibold">
                        Structured evaluation unavailable — showing the raw feedback.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetryEvaluation(m)}
                        disabled={evaluating}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg transition cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        Retry evaluation ↻
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="w-full">
                <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm text-sm sm:text-base text-gray-200 leading-relaxed space-y-2 border border-purple-500/20 w-full max-h-[45vh] overflow-y-auto">
                  <p className="whitespace-pre-wrap">{m.content || 'Generating sentence...'}</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className="flex flex-col items-end gap-1.5 ml-auto max-w-[95%] sm:max-w-[90%]"
            >
              <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tr-sm text-sm sm:text-base leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}

        {isCompleted && (
          <div
            data-testid="session-completed-banner"
            className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-2"
          >
            <p className="text-base font-bold text-emerald-300">
              🎉 All target constructions practiced!
            </p>
            <p className="text-xs text-gray-300">
              You've completed all constructions in this session. Ready to rate your recall?
            </p>
            <button
              type="button"
              onClick={handleFinishSession}
              className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Finish & Rate Recall →
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Mobile Collapsible Actions Modal / Stack */}
      {mobileActionsOpen && (
        <div
          data-testid="mobile-practice-actions-panel"
          className="sm:hidden absolute top-4 left-2 right-2 z-50 flex flex-col gap-2 p-3.5 rounded-xl bg-[#10111c] border border-purple-500/40 shadow-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <span>🌐</span>
                <span>Round {currentRoundIndex + 1}</span>
              </span>
              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full">
                {distinctCardCount(rounds.slice(0, currentRoundIndex + 1))} practiced
              </span>
            </div>
            <button
              type="button"
              data-testid="close-mobile-practice-actions"
              onClick={() => setMobileActionsOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {/* Speak / Dictate */}
          <div className="w-full flex justify-center py-1 bg-[#161726] rounded-xl border border-gray-800">
            <AudioRecorder
              settings={settings}
              onTranscribed={(text) => {
                insertTranscription(text);
                setMobileActionsOpen(false);
              }}
              onError={(err) => setErrorMsg(err)}
            />
          </div>

          {/* Translate Button */}
          <button
            type="button"
            data-testid="mobile-practice-translate-button"
            onClick={() => {
              if (!inputText.trim() || evaluating || isCompleted) return;
              setMobileActionsOpen(false);
              handleSendTranslation();
            }}
            disabled={!inputText.trim() || evaluating || isCompleted}
            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>▶</span>
            <span>Translate Translation</span>
          </button>

          {/* Next Round */}
          <button
            type="button"
            onClick={() => {
              handleNextRound();
              setMobileActionsOpen(false);
            }}
            disabled={
              evaluating ||
              roundLoading ||
              isCompleted ||
              activeCardIndex >= allCards.length - 1
            }
            className="w-full py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>➡️</span>
            <span>Next Round</span>
          </button>

          {/* Finish Practice */}
          <button
            type="button"
            onClick={() => {
              handleFinishSession();
              setMobileActionsOpen(false);
            }}
            disabled={evaluating}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>✓</span>
            <span>Finish & Rate Recall</span>
          </button>

          {/* Exit option if onExit provided */}
          {onExit && (
            <button
              type="button"
              onClick={() => {
                setMobileActionsOpen(false);
                onExit();
              }}
              className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 font-semibold text-xs rounded-xl border border-gray-800 transition cursor-pointer text-center"
            >
              Exit to Practice Modes
            </button>
          )}
        </div>
      )}

      {/* Navigation & Controls Footer (Full-Width Textarea Dock + Actions Bar) */}
      <div className="p-2 sm:p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTranslation();
          }}
          className="space-y-1.5 sm:space-y-2"
        >
          {/* Desktop shortcut hint */}
          <div className="hidden sm:flex justify-between items-center text-[10px] text-gray-500 font-medium">
            <span>Enter adds a new line · Ctrl/⌘ + Enter translates</span>
          </div>

          {/* Full-Width Translation Input Textarea */}
          <div className="w-full">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                scrollToActivePassage();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendTranslation();
                }
              }}
              placeholder={
                isCompleted
                  ? 'Session complete! Click Finish & Rate Recall above.'
                  : 'Type or speak your English translation...'
              }
              rows={3}
              disabled={evaluating || isCompleted}
              className="w-full min-h-[46px] sm:min-h-[54px] max-h-[110px] sm:max-h-[140px] bg-[#0e0f17] border border-gray-800 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium resize-none disabled:opacity-60"
            />
          </div>

          {/* Controls Bar Under Textarea */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5">
              {/* Mobile Actions Drawer Toggle */}
              <button
                type="button"
                data-testid="toggle-mobile-practice-actions"
                onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                className="py-1 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700/70 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⚡</span>
                <span className="text-[11px] text-purple-300 font-bold">
                  Actions · R{currentRoundIndex + 1} {mobileActionsOpen ? '▼' : '▲'}
                </span>
              </button>

              {/* Audio Recorder Button (Desktop only inline) */}
              <div className="hidden sm:flex shrink-0 items-center">
                <AudioRecorder
                  settings={settings}
                  onTranscribed={insertTranscription}
                  onError={(err) => setErrorMsg(err)}
                />
              </div>
            </div>

            {/* Translate Button (Desktop only inline) */}
            <button
              type="submit"
              disabled={!inputText.trim() || evaluating || isCompleted}
              className="hidden sm:inline-flex px-4 sm:px-6 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0 text-center"
            >
              Translate ▶
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
