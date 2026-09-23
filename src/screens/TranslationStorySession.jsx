import React, { useState, useEffect, useRef } from 'react';
import { generateTranslationStoryPassage, evaluateTranslationStory } from '../services/aiService';
import { parseStoryFeedback } from '../prompts';
import AudioRecorder from '../components/AudioRecorder';

// Cap the auto-grown input so the round's Russian passage keeps its room.
const MAX_INPUT_HEIGHT = 200;

/**
 * Flatten per-round candidate constructions into the session-wide import list:
 * dedupe by normalized construction text (earliest round wins) and cap the
 * total at the session budget.
 *
 * @param {Array} rounds - Completed story rounds ({ feedback: { constructions } })
 * @param {number} maxImprovements - Session-wide cap (settings.maxImprovements)
 * @returns {Array} Construction entries in the vault improvement shape
 */
export function aggregateStoryConstructions(rounds, maxImprovements = Infinity) {
  const cap = Number.isFinite(maxImprovements) && maxImprovements > 0 ? maxImprovements : Infinity;
  const seen = new Set();
  const aggregated = [];

  for (const round of rounds || []) {
    const constructions = round?.feedback?.constructions || round?.constructions || [];
    for (const item of constructions) {
      const key = (item?.construction || item?.improved || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      aggregated.push(item);
      if (aggregated.length >= cap) return aggregated;
    }
  }
  return aggregated;
}

/**
 * Per-round feedback card: overall summary, the fluent daily-speaking improved
 * version (or an affirmation when the translation was already natural), and
 * the candidate constructions demonstrated by the round.
 */
function StoryFeedbackCard({ feedback }) {
  return (
    <div
      data-testid="story-feedback"
      className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 w-full space-y-3"
    >
      <p className="text-sm text-gray-100 font-semibold">
        {feedback.summary || 'Feedback complete.'}
      </p>

      {feedback.alreadyNatural ? (
        <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
            Natural as-is
          </p>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Your translation already sounds like fluent daily speech. ✓
          </p>
        </div>
      ) : (
        feedback.improvedVersion && (
          <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Fluent daily-speaking version
            </p>
            <p className="text-sm text-emerald-100 leading-relaxed">{feedback.improvedVersion}</p>
          </div>
        )
      )}

      {feedback.constructions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
            Constructions from this round
          </p>
          <ul className="space-y-2">
            {feedback.constructions.map((c, i) => (
              <li
                key={`${c.construction}-${i}`}
                data-testid="story-construction"
                className="rounded-xl bg-gray-900/60 border border-gray-800 p-3 space-y-1"
              >
                <p className="text-sm font-extrabold text-purple-300">"{c.construction}"</p>
                {(c.original || c.improved) && (
                  <p className="text-xs text-gray-300">
                    {c.original && <span className="text-rose-400 line-through">{c.original}</span>}
                    {c.original && c.improved && ' → '}
                    {c.improved && <span className="text-emerald-400">{c.improved}</span>}
                  </p>
                )}
                {c.explanation && <p className="text-xs text-gray-400">{c.explanation}</p>}
                <p className="text-[10px] text-gray-500 font-semibold">
                  {c.category} · {(c.spoken_frequency || '').replace('_', ' ')} freq
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


export default function TranslationStorySession({ session = {}, settings = {}, onFinish }) {
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const [inputText, setInputText] = useState('');
  const [passageLoading, setPassageLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const roundsRef = useRef([]);
  const requestedRoundsRef = useRef(new Set());

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rounds, passageLoading, evaluating]);

  // Grow the text area with its content, up to the cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [inputText]);

  const currentRound = rounds[roundIndex] || null;

  // Generate a new story passage whenever a fresh round begins. The ref keeps
  // StrictMode's double effect invocation from issuing two requests.
  useEffect(() => {
    async function loadStoryPassage(idx) {
      setPassageLoading(true);
      setErrorMsg('');

      try {
        const historyTopics = roundsRef.current.map((r) => r.passage).filter(Boolean);
        const passage = await generateTranslationStoryPassage(session, settings, historyTopics);
        setRounds((prev) => [
          ...prev,
          {
            id: `round_${idx}`,
            passage,
            translation: '',
            feedback: null,
            rawFeedback: '',
            unparsed: false,
          },
        ]);
      } catch (err) {
        // Allow a later attempt for this round instead of caching the failure.
        requestedRoundsRef.current.delete(idx);
        setErrorMsg(err.message || 'Failed to load story passage from AI.');
      } finally {
        setPassageLoading(false);
      }
    }

    if (requestedRoundsRef.current.has(roundIndex)) return;
    requestedRoundsRef.current.add(roundIndex);
    loadStoryPassage(roundIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, retryTick]);

  const requestFeedback = async (idx, passage, translation) => {
    setEvaluating(true);
    setErrorMsg('');

    try {
      const raw = await evaluateTranslationStory(passage, translation, settings);
      const parsed = parseStoryFeedback(raw);
      setRounds((prev) =>
        prev.map((r, i) => {
          if (i !== idx) return r;
          if (parsed.success) {
            return { ...r, feedback: parsed.feedback, rawFeedback: raw.trim(), unparsed: false };
          }
          return { ...r, rawFeedback: raw.trim(), unparsed: true };
        })
      );
    } catch (err) {
      // Drop the submitted translation back into the input so the learner can resubmit.
      setRounds((prev) => prev.map((r, i) => (i === idx ? { ...r, translation: '' } : r)));
      setInputText(translation);
      setErrorMsg(err.message || 'Failed to evaluate the translation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmitTranslation = () => {
    const text = inputText.trim();
    if (!text || !currentRound || !currentRound.passage) return;
    if (currentRound.feedback || currentRound.unparsed || evaluating || passageLoading) return;

    setInputText('');
    setRounds((prev) => prev.map((r, i) => (i === roundIndex ? { ...r, translation: text } : r)));
    requestFeedback(roundIndex, currentRound.passage, text);
  };

  const handleRetryFeedback = () => {
    if (!currentRound?.translation || evaluating) return;
    requestFeedback(roundIndex, currentRound.passage, currentRound.translation);
  };

  const handleRetryPassage = () => {
    setErrorMsg('');
    setRetryTick((t) => t + 1);
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
    if (evaluating || passageLoading) return;
    if (!currentRound?.translation) return;
    setRoundIndex((i) => i + 1);
  };

  const handleFinish = () => {
    if (evaluating || passageLoading) return;
    if (onFinish) onFinish(roundsRef.current);
  };

  const canSubmit =
    Boolean(inputText.trim()) &&
    Boolean(currentRound?.passage) &&
    !currentRound?.feedback &&
    !currentRound?.unparsed &&
    !evaluating &&
    !passageLoading;

  const translationLocked = Boolean(
    currentRound?.translation || currentRound?.feedback || currentRound?.unparsed
  );

  return (
    <div className="flex flex-col h-full">
      {/* Round thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {rounds.map((round, idx) => (
          <div key={round.id} className="space-y-3">
            <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1">
                Round {idx + 1} · Story passage
              </span>
              <div className="glass-panel p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-purple-500/20 text-white w-full">
                <p className="whitespace-pre-wrap">📖 {round.passage}</p>
              </div>
            </div>

            {round.translation && (
              <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
                <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                  <p className="whitespace-pre-wrap">{round.translation}</p>
                </div>
              </div>
            )}

            {round.feedback && <StoryFeedbackCard feedback={round.feedback} />}

            {round.unparsed && (
              <div className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-amber-700/40 w-full space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  Feedback (unparsed)
                </p>
                <p
                  data-testid="story-raw-feedback"
                  className="text-xs text-gray-300 whitespace-pre-wrap"
                >
                  {round.rawFeedback}
                </p>
                {idx === roundIndex && (
                  <button
                    onClick={handleRetryFeedback}
                    disabled={evaluating}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Retry Evaluation
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {passageLoading && (
          <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
            <div className="glass-panel p-4 rounded-2xl rounded-tl-sm text-sm border border-purple-500/20 text-gray-400 italic w-full">
              Writing your story...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between gap-2">
          <span>⚠️ {errorMsg}</span>
          {!currentRound && !passageLoading && (
            <button
              onClick={handleRetryPassage}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition cursor-pointer shrink-0"
            >
              Retry
            </button>
          )}
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
              disabled={evaluating || passageLoading || !currentRound?.translation}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
            >
              Next Round →
            </button>
            <button
              onClick={handleFinish}
              disabled={evaluating || passageLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              Finish Story ✓
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitTranslation();
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
                handleSubmitTranslation();
              }
            }}
            placeholder="Type or speak your English translation..."
            rows={3}
            disabled={evaluating || passageLoading || !currentRound?.passage || translationLocked}
            className="w-full min-h-[76px] max-h-[200px] bg-[#0e0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium resize-y disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500 font-medium">
              Enter adds a new line · Ctrl/⌘ + Enter translates
            </span>
            <button
              type="submit"
              disabled={!canSubmit}
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
