import React, { useState, useEffect, useRef } from 'react';
import AudioPlayerButton from './AudioPlayerButton';
import AudioRecorder from './AudioRecorder';
import {
  getSentenceDeepStudy,
  generateAdditionalSentenceExamples,
  evaluatePracticeExercise,
} from '../services/aiService';

export default function ExplainPracticeModal({
  isOpen,
  onClose,
  sentence,
  settings,
  cache,
  direction = 'ru-en',
}) {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'examples' | 'practice'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studyData, setStudyData] = useState(null);

  // Examples tab state
  const [examplesList, setExamplesList] = useState([]);
  const [loadingMoreExamples, setLoadingMoreExamples] = useState(false);
  const [examplesError, setExamplesError] = useState(null);

  // Practice tab state
  const [practiceMode, setPracticeMode] = useState('translation'); // 'translation' | 'cloze'
  const [userAttempt, setUserAttempt] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [practiceError, setPracticeError] = useState(null);

  const localCacheRef = useRef(cache || new Map());
  if (cache) {
    localCacheRef.current = cache;
  }

  // Load unified study package on sentence change, direction change, or modal open
  useEffect(() => {
    if (!isOpen || !sentence) return;

    const cacheKey = `${sentence.ru}::${sentence.en}::${direction}`;
    const cached = localCacheRef.current.get(cacheKey);

    if (cached) {
      setStudyData(cached);
      setExamplesList(cached.examples || []);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getSentenceDeepStudy(sentence, settings, direction);
        if (isMounted) {
          localCacheRef.current.set(cacheKey, result);
          setStudyData(result);
          setExamplesList(result.examples || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to generate sentence explanation.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sentence, settings, direction]);

  // Reset practice state on tab/mode switch or modal close
  useEffect(() => {
    setUserAttempt('');
    setEvaluation(null);
    setPracticeError(null);
  }, [activeTab, practiceMode, sentence, direction]);

  if (!isOpen || !sentence) return null;

  const handleGenerateMoreExamples = async () => {
    setLoadingMoreExamples(true);
    setExamplesError(null);
    try {
      const more = await generateAdditionalSentenceExamples(sentence, examplesList, settings, direction);
      const updated = [...examplesList, ...more];
      setExamplesList(updated);

      // Update cached record
      const cacheKey = `${sentence.ru}::${sentence.en}::${direction}`;
      const existing = localCacheRef.current.get(cacheKey) || {};
      localCacheRef.current.set(cacheKey, { ...existing, examples: updated });
    } catch (err) {
      setExamplesError(err.message || 'Failed to generate additional examples.');
    } finally {
      setLoadingMoreExamples(false);
    }
  };

  const handleSubmitPractice = async (e) => {
    if (e) e.preventDefault();
    if (!userAttempt.trim() || evaluating) return;

    setEvaluating(true);
    setPracticeError(null);

    const isCloze = practiceMode === 'cloze';
    const clozeData = studyData?.practice?.cloze;
    const transData = studyData?.practice?.translation;

    try {
      const params = isCloze
        ? {
            exerciseType: 'cloze',
            prompt: clozeData?.sentenceWithBlank || (direction === 'en-ru' ? sentence.ru : sentence.en),
            reference: clozeData?.promptTranslation || (direction === 'en-ru' ? sentence.en : sentence.ru),
            blankTarget: clozeData?.blankTarget,
            userAttempt: userAttempt.trim(),
            direction: clozeData?.targetLanguage === 'ru' ? 'en-ru' : (direction || 'ru-en'),
            originalCard: sentence,
          }
        : {
            exerciseType: 'translation',
            targetRu: sentence.ru,
            targetEn: sentence.en,
            prompt: transData?.prompt || (direction === 'en-ru' ? sentence.en : sentence.ru),
            reference: transData?.reference || (direction === 'en-ru' ? sentence.ru : sentence.en),
            userAttempt: userAttempt.trim(),
            direction: transData?.direction || direction || 'ru-en',
            originalCard: sentence,
          };

      const result = await evaluatePracticeExercise(params, settings);
      setEvaluation(result);
    } catch (err) {
      setPracticeError(err.message || 'Failed to evaluate practice attempt.');
    } finally {
      setEvaluating(false);
    }
  };

  const explanation = studyData?.explanation;
  const translationExercise = studyData?.practice?.translation;
  const clozeExercise = studyData?.practice?.cloze;

  const activePracticePrompt = practiceMode === 'cloze'
    ? (clozeExercise?.sentenceWithBlank || (direction === 'en-ru' ? sentence.ru : sentence.en))
    : (translationExercise?.prompt || (direction === 'en-ru' ? sentence.en : sentence.ru));

  const practiceTargetLang = practiceMode === 'cloze'
    ? (clozeExercise?.targetLanguage || (direction === 'en-ru' ? 'ru' : 'en'))
    : (translationExercise?.direction === 'en-ru' || direction === 'en-ru' ? 'ru' : 'en');

  return (
    <div
      data-testid="explain-practice-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-indigo-500/30 bg-slate-900/95 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Explain & Practice
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-white">
                  🇷🇺 {sentence.ru}
                </span>
                <AudioPlayerButton text={sentence.ru} settings={settings} size="sm" />
              </div>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-300">
                  🇬🇧 {sentence.en}
                </span>
                <AudioPlayerButton text={sentence.en} settings={settings} size="sm" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-750 transition-colors"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'explanation'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📖 Explanation</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('examples')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'examples'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💡 Examples</span>
            {examplesList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {examplesList.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'practice'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡ Practice</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Initial Loading */}
          {loading && (
            <div className="p-12 text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400 mx-auto" />
              <p className="text-xs text-indigo-300 font-medium">
                Analyzing sentence nuances, examples, and practice drills...
              </p>
            </div>
          )}

          {/* Initial Error */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-300 text-xs space-y-2">
              <p className="font-bold">⚠️ {error}</p>
              <button
                type="button"
                onClick={() => {
                  localCacheRef.current.delete(`${sentence.ru}::${sentence.en}::${direction}`);
                  setLoading(true);
                  getSentenceDeepStudy(sentence, settings, direction)
                    .then((res) => {
                      setStudyData(res);
                      setExamplesList(res.examples || []);
                      setError(null);
                    })
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
                className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tab 1: Explanation */}
          {!loading && !error && activeTab === 'explanation' && (
            <div data-testid="tab-explanation" className="space-y-6 animate-fade-in">
              {/* Meaning & Nuance */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                    Overall Meaning
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {explanation?.overallMeaning || 'Natural conversational expression.'}
                  </p>
                </div>

                {explanation?.nuances && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                      Nuances & Conversational Flavor
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {explanation.nuances}
                    </p>
                  </div>
                )}
              </div>

              {/* Vocabulary and Grammar Breakdown */}
              {Array.isArray(explanation?.vocabulary) && explanation.vocabulary.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Key Vocabulary & Grammar Roles
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Term</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Case / Aspect</th>
                          <th className="py-2.5 px-3">Meaning</th>
                          <th className="py-2.5 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {explanation.vocabulary.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                              {v.term}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-300">{v.role || '—'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                              {v.caseOrAspect || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-emerald-300">{v.meaning || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">{v.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Usage & Formality */}
              {explanation?.usage && (
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Register & Formality
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {explanation.usage.formality}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Typical Situational Context
                    </span>
                    <p className="text-slate-300 text-xs">
                      {explanation.usage.context || 'General conversational speech'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Examples */}
          {!loading && !error && activeTab === 'examples' && (
            <div data-testid="tab-examples" className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Contextual Variations & Patterns
                </span>
                <span className="text-[11px] text-slate-500">
                  {examplesList.length} example{examplesList.length === 1 ? '' : 's'}
                </span>
              </div>

              {examplesError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
                  ⚠️ {examplesError}
                </div>
              )}

              <div className="space-y-2.5">
                {examplesList.map((ex, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">🇷🇺 {ex.ru}</span>
                        <AudioPlayerButton text={ex.ru} settings={settings} size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">🇬🇧 {ex.en}</span>
                        <AudioPlayerButton text={ex.en} settings={settings} size="sm" />
                      </div>
                    </div>
                    {ex.contextType && (
                      <span className="self-start sm:self-center text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ex.contextType}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateMoreExamples}
                  disabled={loadingMoreExamples}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all flex items-center gap-2 shadow-md"
                >
                  {loadingMoreExamples ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                      <span>Generating more...</span>
                    </>
                  ) : (
                    <span>➕ Generate More Examples</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Practice */}
          {!loading && !error && activeTab === 'practice' && (
            <div data-testid="tab-practice" className="space-y-5 animate-fade-in">
              {/* Exercise Type Toggle */}
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setPracticeMode('translation')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    practiceMode === 'translation'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🎯 Translation Drill
                </button>
                <button
                  type="button"
                  onClick={() => setPracticeMode('cloze')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    practiceMode === 'cloze'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📝 Fill in the Blank
                </button>
              </div>

              {/* Practice Prompt Display */}
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                  {practiceMode === 'cloze' ? 'Complete the Sentence' : 'Translate Sentence'}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                    "{activePracticePrompt}"
                  </h4>
                  <AudioPlayerButton text={activePracticePrompt} settings={settings} size="sm" />
                </div>
                {practiceMode === 'cloze' && clozeExercise?.promptTranslation && (
                  <p className="text-xs text-slate-400 italic">
                    Meaning: "{clozeExercise.promptTranslation}"
                  </p>
                )}
                {practiceMode === 'cloze' && clozeExercise?.hint && (
                  <p className="text-xs text-amber-300/80">💡 Hint: {clozeExercise.hint}</p>
                )}
                {practiceMode === 'translation' && translationExercise?.hint && (
                  <p className="text-xs text-amber-300/80">💡 Hint: {translationExercise.hint}</p>
                )}
              </div>

              {practiceError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
                  ⚠️ {practiceError}
                </div>
              )}

              {/* Form / Answer input */}
              {!evaluation ? (
                <form onSubmit={handleSubmitPractice} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={userAttempt}
                      onChange={(e) => setUserAttempt(e.target.value)}
                      placeholder={
                        practiceMode === 'cloze'
                          ? 'Type the missing word or phrase...'
                          : `Type your translation in ${practiceTargetLang === 'ru' ? 'Russian' : 'English'} or use speech...`
                      }
                      className="w-full p-3.5 pr-14 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    />
                    <div className="absolute right-2.5 bottom-3.5">
                      <AudioRecorder
                        settings={settings}
                        language={practiceTargetLang}
                        onTranscribed={(text) =>
                          setUserAttempt((prev) => (prev ? `${prev} ${text}` : text))
                        }
                        onError={(err) => setPracticeError(err)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={evaluating || !userAttempt.trim()}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
                    >
                      {evaluating ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Check Answer</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Evaluation Breakdown */
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
                          Ideal Phrasing:
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <p className="text-sm font-bold text-white">
                            "{evaluation.naturalRewrite}"
                          </p>
                          <AudioPlayerButton
                            text={evaluation.naturalRewrite}
                            settings={settings}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}

                    {evaluation.explanation && (
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                        {evaluation.explanation}
                      </p>
                    )}
                  </div>

                  {/* Actions after evaluation */}
                  <div className="flex flex-wrap gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEvaluation(null);
                        setUserAttempt('');
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                    >
                      🔄 Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPracticeMode((m) => (m === 'translation' ? 'cloze' : 'translation'));
                        setEvaluation(null);
                        setUserAttempt('');
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                    >
                      ⚡ Try Other Exercise Type
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
