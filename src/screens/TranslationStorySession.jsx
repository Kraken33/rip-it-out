import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateTranslationStoryPassage, evaluateTranslationStory } from '../services/aiService';
import { parseStoryFeedback, VARIETY_MATRIX, VARIETY_PRESETS, sampleVarietyMatrix } from '../prompts';
import ConstructionExtractor from '../components/ConstructionExtractor';
import InteractiveSessionShell from '../components/InteractiveSessionShell';
import { scrollToElementBottom } from '../hooks/useVisualViewport';

/**
 * Flatten per-round candidate constructions into the session-wide import list:
 * dedupe by normalized construction text (earliest round wins). When `max` is
 * provided the total is capped; when omitted every candidate is returned.
 *
 * @param {Array} rounds - Completed story rounds ({ feedback: { constructions } })
 * @param {number} [maxImprovements] - Optional session-wide cap
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
function StoryFeedbackCard({ feedback, sessionId, settings, passage }) {
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
          <ConstructionExtractor
            sessionId={sessionId}
            settings={settings}
            sourceText={feedback.improvedVersion}
            passage={passage}
            className="w-full"
          >
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                Fluent daily-speaking version
              </p>
              <p className="text-sm text-emerald-100 leading-relaxed">{feedback.improvedVersion}</p>
            </div>
          </ConstructionExtractor>
        )
      )}

      {(feedback.constructions || []).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
            Constructions from this round
          </p>
          <ul className="space-y-2">
            {(feedback.constructions || []).map((c, i) => (
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
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [varietyMatrix, setVarietyMatrix] = useState(
    session.varietyMatrix || { domain: 'auto', tone: 'auto', format: 'auto', catalyst: 'auto' }
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const roundsRef = useRef([]);
  const requestedRoundsRef = useRef(new Set());
  const recentMatrixSamples = useRef([]);

  const scrollToActivePassage = useCallback(() => {
    scrollToElementBottom(messagesEndRef.current);
  }, []);

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  useEffect(() => {
    scrollToActivePassage();
  }, [rounds, passageLoading, evaluating, scrollToActivePassage]);

  const currentRound = rounds[roundIndex] || null;

  // Generate a new story passage whenever a fresh round begins.
  useEffect(() => {
    async function loadStoryPassage(idx) {
      setPassageLoading(true);
      setErrorMsg('');

      try {
        const sample = sampleVarietyMatrix(varietyMatrix, recentMatrixSamples.current);
        recentMatrixSamples.current = [...recentMatrixSamples.current, sample];
        const historyTopics = roundsRef.current.map((r) => r.passage).filter(Boolean);
        const passage = await generateTranslationStoryPassage(session, settings, historyTopics, sample);
        setRounds((prev) => [
          ...prev,
          {
            id: `round_${idx}`,
            passage,
            varietySample: sample,
            translation: '',
            feedback: null,
            rawFeedback: '',
            unparsed: false,
          },
        ]);
      } catch (err) {
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

  const handleRerollStory = async () => {
    if (passageLoading || evaluating || !currentRound || currentRound.translation) return;
    setPassageLoading(true);
    setErrorMsg('');

    try {
      const sample = sampleVarietyMatrix(varietyMatrix, recentMatrixSamples.current);
      recentMatrixSamples.current = [...recentMatrixSamples.current, sample];
      const historyTopics = roundsRef.current
        .filter((_, i) => i !== roundIndex)
        .map((r) => r.passage)
        .filter(Boolean);
      const passage = await generateTranslationStoryPassage(session, settings, historyTopics, sample);
      setRounds((prev) =>
        prev.map((r, i) =>
          i === roundIndex
            ? {
                ...r,
                passage,
                varietySample: sample,
                translation: '',
                feedback: null,
                rawFeedback: '',
                unparsed: false,
              }
            : r
        )
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reroll story passage.');
    } finally {
      setPassageLoading(false);
    }
  };

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

  const headerLeftContent = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
        <span>📖</span>
        <span>Round {roundIndex + 1}</span>
      </span>
      {currentRound?.varietySample?.vibeLabel && (
        <span
          data-testid="story-header-vibe-badge"
          className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full"
        >
          {currentRound.varietySample.vibeLabel}
        </span>
      )}
    </div>
  );

  const headerRightContent = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setMatrixOpen(!matrixOpen)}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
          matrixOpen
            ? 'bg-purple-900/50 text-purple-200 border-purple-500'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
        }`}
      >
        <span>✨</span>
        <span>Flavor</span>
      </button>

      <button
        type="button"
        onClick={handleNextRound}
        disabled={evaluating || passageLoading || !currentRound?.translation}
        className="hidden sm:inline-flex px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
      >
        Next Round →
      </button>

      <button
        type="button"
        onClick={handleFinish}
        disabled={evaluating || passageLoading}
        className="hidden sm:inline-flex px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
      >
        Finish Story ✓
      </button>
    </div>
  );

  const mobileHeaderContent = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-white flex items-center gap-1">
        <span>📖</span>
        <span>Round {roundIndex + 1}</span>
      </span>
      {currentRound?.varietySample?.vibeLabel && (
        <span
          data-testid="story-hud-vibe-badge"
          className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full"
        >
          {currentRound.varietySample.vibeLabel}
        </span>
      )}
    </div>
  );

  const varietyMatrixDrawer = matrixOpen && (
    <div className="p-3.5 border-t border-[#27283d] bg-[#121320] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
          <span>✨</span> Tune Story Flavor (Applies to next rounds)
        </span>
        <button
          type="button"
          onClick={() => setMatrixOpen(false)}
          className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setSelectedPreset(null);
            setVarietyMatrix({ domain: 'auto', tone: 'auto', format: 'auto', catalyst: 'auto' });
          }}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
            !selectedPreset && Object.values(varietyMatrix).every((v) => v === 'auto')
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : 'bg-[#1b1c2b] text-gray-300 border-[#27283d] hover:border-purple-500/50'
          }`}
        >
          🎲 Auto Variety
        </button>
        {VARIETY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              setSelectedPreset(preset.id);
              setVarietyMatrix({ ...preset.matrix });
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              selectedPreset === preset.id
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-[#1b1c2b] text-gray-300 border-[#27283d] hover:border-purple-500/50'
            }`}
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        <div>
          <label htmlFor="insession-matrix-domain" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Domain
          </label>
          <select
            id="insession-matrix-domain"
            value={varietyMatrix.domain}
            onChange={(e) => {
              setSelectedPreset(null);
              setVarietyMatrix((prev) => ({ ...prev, domain: e.target.value }));
            }}
            className="w-full bg-[#1b1c2b] border border-[#27283d] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="auto">🎲 Auto Domain</option>
            {VARIETY_MATRIX.domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="insession-matrix-tone" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Tone
          </label>
          <select
            id="insession-matrix-tone"
            value={varietyMatrix.tone}
            onChange={(e) => {
              setSelectedPreset(null);
              setVarietyMatrix((prev) => ({ ...prev, tone: e.target.value }));
            }}
            className="w-full bg-[#1b1c2b] border border-[#27283d] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="auto">🎲 Auto Tone</option>
            {VARIETY_MATRIX.tones.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="insession-matrix-format" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Format
          </label>
          <select
            id="insession-matrix-format"
            value={varietyMatrix.format}
            onChange={(e) => {
              setSelectedPreset(null);
              setVarietyMatrix((prev) => ({ ...prev, format: e.target.value }));
            }}
            className="w-full bg-[#1b1c2b] border border-[#27283d] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="auto">🎲 Auto Format</option>
            {VARIETY_MATRIX.formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="insession-matrix-catalyst" className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Catalyst
          </label>
          <select
            id="insession-matrix-catalyst"
            value={varietyMatrix.catalyst}
            onChange={(e) => {
              setSelectedPreset(null);
              setVarietyMatrix((prev) => ({ ...prev, catalyst: e.target.value }));
            }}
            className="w-full bg-[#1b1c2b] border border-[#27283d] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="auto">🎲 Auto Catalyst</option>
            {VARIETY_MATRIX.catalysts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <InteractiveSessionShell
      messagesEndRef={messagesEndRef}
      onKeyboardOpen={scrollToActivePassage}
      headerLeft={headerLeftContent}
      headerRight={headerRightContent}
      mobileHeaderContent={mobileHeaderContent}
      mobileRoundLabel={`R${roundIndex + 1}`}
      mobileSubmitLabel="Translate Translation"
      mobileSubmitTestId="mobile-story-translate-button"
      renderMobileActions={({ closeMenu }) => (
        <>
          <button
            type="button"
            onClick={() => {
              setMatrixOpen(!matrixOpen);
              closeMenu();
            }}
            className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              matrixOpen
                ? 'bg-purple-900/50 text-purple-200 border-purple-500'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
          >
            <span>✨</span>
            <span>Tune Story Flavor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleNextRound();
              closeMenu();
            }}
            disabled={evaluating || passageLoading || !currentRound?.translation}
            className="w-full py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>➡️</span>
            <span>Next Round</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFinish();
              closeMenu();
            }}
            disabled={evaluating || passageLoading}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>✓</span>
            <span>Finish Story</span>
          </button>
        </>
      )}
      drawer={varietyMatrixDrawer}
      errorMsg={errorMsg}
      renderErrorAction={
        !currentRound &&
        !passageLoading && (
          <button
            onClick={handleRetryPassage}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition cursor-pointer shrink-0"
          >
            Retry
          </button>
        )
      }
      inputRef={inputRef}
      inputText={inputText}
      onInputChange={setInputText}
      onInputFocus={scrollToActivePassage}
      onSubmit={handleSubmitTranslation}
      canSubmit={canSubmit}
      submitLabel="Translate ▶"
      inputPlaceholder="Type or speak your English translation..."
      shortcutHint="Enter adds a new line · Ctrl/⌘ + Enter translates"
      inputDisabled={evaluating || passageLoading || !currentRound?.passage || translationLocked}
      settings={settings}
      onAudioError={(err) => setErrorMsg(err)}
    >
      {rounds.map((round, idx) => (
        <div key={round.id} className="space-y-3">
          <div className="flex flex-col items-start gap-1.5 max-w-[95%] sm:max-w-[90%] w-full">
            <div className="flex items-center justify-between gap-2 w-full px-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Round {idx + 1} · Story passage
              </span>
              {round.varietySample?.vibeLabel && (
                <span
                  data-testid="story-vibe-badge"
                  className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-full"
                >
                  {round.varietySample.vibeLabel}
                </span>
              )}
            </div>
            <ConstructionExtractor
              sessionId={session?.id}
              settings={settings}
              sourceText={round.passage}
              passage={round.passage}
              className="w-full"
            >
              <div className="glass-panel p-3.5 sm:p-4 rounded-2xl rounded-tl-sm text-sm sm:text-base leading-relaxed border border-purple-500/20 text-white w-full max-h-[45vh] overflow-y-auto">
                <p className="whitespace-pre-wrap">📖 {round.passage}</p>
              </div>
            </ConstructionExtractor>
            {idx === roundIndex && !round.translation && !evaluating && !passageLoading && (
              <div className="flex justify-end w-full pt-0.5">
                <button
                  type="button"
                  onClick={handleRerollStory}
                  className="px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:text-purple-300 transition cursor-pointer flex items-center gap-1 hover:bg-purple-950/30 rounded-lg"
                >
                  <span>🎲</span> Reroll Story
                </button>
              </div>
            )}
          </div>

          {round.translation && (
            <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
              <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                <p className="whitespace-pre-wrap">{round.translation}</p>
              </div>
            </div>
          )}

          {round.feedback && (
            <StoryFeedbackCard
              feedback={round.feedback}
              sessionId={session?.id}
              settings={settings}
              passage={round.passage}
            />
          )}

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
    </InteractiveSessionShell>
  );
}
