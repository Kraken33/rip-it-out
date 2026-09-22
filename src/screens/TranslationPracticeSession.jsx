import React, { useState, useEffect, useRef } from 'react';
import { generateTranslationRoundPassage, evaluateTranslationRound } from '../services/aiService';
import { parseTranslationVerdict } from '../prompts';
import { parseTaggedPassage } from '../textAnnotator';
import AudioRecorder from '../components/AudioRecorder';

// Cap the auto-grown input so the round's Russian passage keeps its room.
const MAX_INPUT_HEIGHT = 200;

/**
 * Only passages and learner translations belong in the passage-writing history:
 * replaying verdict JSON would prime the model to answer in JSON instead of prose.
 */
function buildPassageHistory(items) {
  return items
    .filter((m) => !m.verdict && !m.unparsed)
    .filter((m) => typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Per-round verdict: coverage badge per target construction, the overall
 * summary, the rewritten sentence when one is warranted, and notes only for
 * the targets that were used awkwardly or not used at all.
 */
function VerdictCard({ verdict }) {
  const problems = verdict.constructions.filter((c) => !c.used || c.quality === 'awkward');

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
        {verdict.summary || 'Evaluation complete.'}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {verdict.constructions.map((c) => {
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

      {verdict.rewriteNeeded && verdict.rewrite && (
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

export const ITEMS_PER_ROUND = 2;

/**
 * Take up to ITEMS_PER_ROUND distinct cards starting at `offset`, wrapping
 * around `allCards` so unlimited rounds never repeat a construction until
 * every queued construction has been practiced once.
 */
function takeNextCards(allCards, offset) {
  const perRound = Math.min(ITEMS_PER_ROUND, allCards.length);
  const picked = [];
  const seen = new Set();
  let idx = offset;
  while (picked.length < perRound && idx < offset + allCards.length) {
    const card = allCards[idx % allCards.length];
    const key = card.id ?? card.improvementId ?? card.construction;
    if (!seen.has(key)) {
      seen.add(key);
      picked.push(card);
    }
    idx += 1;
  }
  return picked;
}

function distinctCardCount(rounds) {
  const seen = new Set();
  rounds.forEach((r) =>
    (r.cards || []).forEach((c) => seen.add(c.id ?? c.improvementId ?? c.construction))
  );
  return seen.size;
}

export default function TranslationPracticeSession({ allCards = [], settings = {}, onFinish }) {
  // Unlimited on-demand rounds of exactly 2 constructions each (no pre-computed count).
  const [rounds, setRounds] = useState(() => [
    { cards: takeNextCards(allCards, 0) },
  ]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roundLoading, setRoundLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const inputRef = useRef(null);
  const requestedRoundsRef = useRef(new Set());

  const roundsRef = useRef([]);
  const submittedRoundsRef = useRef([]);
  const messageSeqRef = useRef(0);
  const nextMessageId = (prefix) => {
    messageSeqRef.current += 1;
    return `${prefix}_${messageSeqRef.current}`;
  };
  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const currentRoundCards = rounds[currentRoundIndex]?.cards || [];

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roundLoading, evaluating]);

  // Grow the text area with its content, up to the cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [inputText]);

  // Trigger passage generation when the round changes or starts.
  // The ref keeps StrictMode's double effect invocation from issuing two requests.
  useEffect(() => {
    async function loadRoundPassage(roundCards, roundIndex, history) {
      setRoundLoading(true);
      setErrorMsg('');

      const assistantMsgId = nextMessageId(`asst_round_${roundIndex}`);
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
      ]);

      try {
        const reply = await generateTranslationRoundPassage(
          roundCards,
          settings,
          history
        );
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: reply } : m)));
      } catch (err) {
        // Allow a later attempt for this round instead of caching the failure.
        requestedRoundsRef.current.delete(roundIndex);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        setErrorMsg(err.message || 'Failed to load round passage from AI.');
      } finally {
        setRoundLoading(false);
      }
    }

    if (!currentRoundCards || currentRoundCards.length === 0) return;
    if (requestedRoundsRef.current.has(currentRoundIndex)) return;
    requestedRoundsRef.current.add(currentRoundIndex);

    loadRoundPassage(currentRoundCards, currentRoundIndex, buildPassageHistory(messagesRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundIndex]);

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

  const requestVerdict = async (verdictMsgId, roundIndex, userMsgId, passageText, translationText) => {
    setEvaluating(true);
    setErrorMsg('');

    try {
      const roundCards = roundsRef.current[roundIndex]?.cards || currentRoundCards;
      const raw = await evaluateTranslationRound(roundCards, passageText, translationText, settings);
      const parsed = parseTranslationVerdict(raw);

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== verdictMsgId) return m;
          if (parsed.success) {
            return { ...m, pending: false, verdict: parsed.verdict, unparsed: false, rawText: '', retry: null };
          }
          return {
            ...m,
            pending: false,
            verdict: null,
            unparsed: true,
            rawText: raw.trim(),
            retry: { passageText, translation: translationText },
          };
        })
      );

      const submittedCards = roundsRef.current[roundIndex]?.cards || currentRoundCards;
      submittedRoundsRef.current = submittedRoundsRef.current.filter(
        (r) => r.roundIndex !== roundIndex
      );
      submittedRoundsRef.current.push({
        roundIndex,
        cards: submittedCards,
        passageText,
        translationText,
        evaluatedAt: new Date().toISOString(),
        verdict: parsed.success ? parsed.verdict : null,
        rawFeedback: parsed.success ? '' : raw.trim(),
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== verdictMsgId));
      setErrorMsg(err.message || 'Failed to evaluate the translation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendTranslation = () => {
    const text = inputText.trim();
    if (!text || evaluating || roundLoading) return;

    const roundIndex = currentRoundIndex;
    const passageText = currentPassageText;
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

    requestVerdict(verdictMsgId, roundIndex, userMsgId, passageText, text);
  };

  const handleRetryEvaluation = (msg) => {
    if (evaluating || !msg?.retry) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, pending: true, unparsed: false, rawText: '' } : m))
    );
    const roundIndex = submittedRoundsRef.current.find(
      (r) => r.translationText === msg.retry.translation && r.passageText === msg.retry.passageText
    )?.roundIndex ?? currentRoundIndex;
    requestVerdict(msg.id, roundIndex, null, msg.retry.passageText, msg.retry.translation);
  };

  // Dictation lands where the caret is, so a spoken sentence can be dropped into
  // a half-written translation instead of only ever appending at the end.
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
    if (evaluating || roundLoading) return;
    const nextIndex = currentRoundIndex + 1;
    setRounds((prev) => {
      if (nextIndex < prev.length) return prev;
      // Deterministic queue order, wrapping to the start only after every
      // queued construction has been practiced once.
      const offset = prev.reduce((sum, r) => sum + (r.cards?.length || 0), 0);
      return [...prev, { cards: takeNextCards(allCards, offset) }];
    });
    setCurrentRoundIndex(nextIndex);
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
        if (!seen.has(key)) {
          seen.add(key);
          practicedImprovements.push(c);
        }
      })
    );
    onFinish(orderedRounds, practicedImprovements);
  };

  const renderTaggedMessage = (content) => {
    const segments = parseTaggedPassage(content);
    return (
      <span>
        {segments.map((seg, idx) => {
          if (seg.isHighlight) {
            return (
              <span
                key={idx}
                title={seg.target ? `Target: ${seg.target}` : 'Target construction'}
                className="inline-block my-0.5 mx-1 px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/50 text-purple-200 font-semibold cursor-help transition-all hover:bg-purple-800/80"
              >
                {seg.text}
                {seg.target && (
                  <span className="ml-1 text-[10px] text-purple-400 font-normal">
                    ({seg.target})
                  </span>
                )}
              </span>
            );
          }
          return <span key={idx}>{seg.text}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col h-[82vh] glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in">
      {/* Session Header */}
      <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>🌐 Russian Translation Practice</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50">
              Round {currentRoundIndex + 1} · {distinctCardCount(rounds.slice(0, currentRoundIndex + 1))} practiced
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Read Russian text with highlighted constructions and translate it into English!
          </p>
        </div>

        <button
          id="btn-finish-translation-practice"
          onClick={handleFinishSession}
          disabled={evaluating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
        >
          Finish & Rate Recall →
        </button>
      </div>

      {/* Target Constructions Chip Bar */}
      <div className="px-5 py-2.5 bg-[#0a0b12] border-b border-gray-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-bold shrink-0">Round Targets:</span>
        {currentRoundCards.map((c, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50 font-medium shrink-0"
          >
            🎯 {c.construction || c.improved}
          </span>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0e15]/50">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            if (m.verdict) {
              return (
                <div key={m.id} className="flex gap-3 items-start max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                    🤖
                  </div>
                  <VerdictCard verdict={m.verdict} />
                </div>
              );
            }

            if (m.pending) {
              return (
                <div key={m.id} className="flex gap-3 items-start max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                    🤖
                  </div>
                  <div className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 w-full">
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
                <div key={m.id} className="flex gap-3 items-start max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                    🤖
                  </div>
                  <div className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-amber-500/30 w-full space-y-2">
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
              <div key={m.id} className="flex gap-3 items-start max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  🤖
                </div>
                <div className="glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200 leading-relaxed space-y-2 border border-purple-500/20 w-full">
                  <p className="whitespace-pre-wrap">
                    {m.content ? renderTaggedMessage(m.content) : 'Generating passage...'}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
              <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Navigation & Controls Footer */}
      <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
        <div className="flex justify-between items-center">
          <AudioRecorder
            settings={settings}
            onTranscribed={insertTranscription}
            onError={(err) => setErrorMsg(err)}
          />

          <div className="flex gap-2 items-center">
            <button
              onClick={handleNextRound}
              disabled={evaluating || roundLoading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
            >
              Next Round →
            </button>
            <button
              onClick={handleFinishSession}
              disabled={evaluating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              Finish Practice ✓
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTranslation();
          }}
          className="space-y-2"
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSendTranslation();
              }
            }}
            placeholder="Type or speak your English translation..."
            rows={3}
            disabled={evaluating}
            className="w-full min-h-[76px] max-h-[200px] bg-[#0e0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium resize-y"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500 font-medium">
              Enter adds a new line · Ctrl/⌘ + Enter translates
            </span>
            <button
              type="submit"
              disabled={!inputText.trim() || evaluating}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0"
            >
              Translate ▶
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
