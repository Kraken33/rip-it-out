import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getPracticeCards, 
  getImprovement, 
  updateSrsCard, 
  getSettings,
  getSession,
  logActivity
} from '../store';
import { processReview, RATINGS } from '../srs';
import { generatePracticePrompt, generateTranslationPracticePrompt } from '../prompts';
import AudioPlayerButton from '../components/AudioPlayerButton';
import TranslationPracticeSession from './TranslationPracticeSession';

export default function Practice() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('loading');
  const [practiceType, setPracticeType] = useState('translation'); // 'translation' | 'scenario'
  const [translationSubMode, setTranslationSubMode] = useState('seamless'); // 'seamless' | 'prompt'
  const [selectedCards, setSelectedCards] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [translationPromptText, setTranslationPromptText] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const practiceCards = await getPracticeCards(20, 5);
        if (!isMounted) return;

        if (!practiceCards || practiceCards.length === 0) {
          setStep('empty');
          return;
        }

        const imps = (
          await Promise.all(practiceCards.map((card) => getImprovement(card.improvementId)))
        ).filter(Boolean);

        if (!isMounted) return;

        if (imps.length === 0) {
          setStep('empty');
          return;
        }

        setSelectedCards(practiceCards);
        setImprovements(imps);

        const st = await getSettings();
        const scenarioPrompt = generatePracticePrompt(imps.slice(0, 5), st);
        const transPrompt = generateTranslationPracticePrompt(imps, st);

        if (isMounted) {
          setSettings(st);
          setPromptText(scenarioPrompt);
          setTranslationPromptText(transPrompt);
          setStep('prompt');
          setStartTime(Date.now());
        }
      } catch (err) {
        console.error('Error loading practice data:', err);
        if (isMounted) setStep('empty');
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = useCallback((textToCopy) => {
    if (!startTime) setStartTime(Date.now());
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [startTime]);

  const startRating = useCallback(async (customCards) => {
    if (startTime) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        const firstImp = improvements[0];
        const session = firstImp ? await getSession(firstImp.sessionId) : null;
        await logActivity({
          type: 'session',
          durationSeconds,
          sessionId: session?.id || null,
          topicId: session?.topicId || null,
        });
      }
    }

    // Callers hand us improvement records, but the rating step must operate on
    // the SRS cards loaded at mount — processReview/updateSrsCard need real
    // card fields (status, easeFactor, intervalDays) keyed by improvementId.
    if (customCards && Array.isArray(customCards) && customCards.length > 0) {
      const practicedIds = new Set(customCards.map((c) => c.id ?? c.improvementId));
      const cardsToRate = selectedCards.filter((c) => practicedIds.has(c.improvementId));
      const rateableIds = new Set(cardsToRate.map((c) => c.improvementId));
      const impsToRate = improvements.filter((i) => rateableIds.has(i.id));
      setSelectedCards(cardsToRate);
      setImprovements(impsToRate);
      if (cardsToRate.length === 0) {
        setStep('complete');
        return;
      }
    }

    setStep('rating');
    setCurrentIndex(0);
  }, [startTime, improvements, selectedCards]);

  const handleRate = useCallback(async (score) => {
    const card = selectedCards[currentIndex];
    const updates = processReview(card, score);
    await updateSrsCard(card.improvementId, updates);

    if (currentIndex + 1 < selectedCards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep('complete');
    }
  }, [currentIndex, selectedCards]);

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-gray-400 font-medium text-sm">Loading practice mode...</div>
      </div>
    );
  }

  if (step === 'empty') {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in py-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Practice Mode</h1>
          <p className="text-xs text-gray-400">No phrases due for practice right now.</p>
        </header>

        <div className="glass-panel p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-lg font-bold text-white">You're all caught up!</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You've reviewed all your due phrases. Create a new session or check back later!
          </p>
          <div className="pt-2">
            <Link 
              to="/" 
              className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all shadow"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in py-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Practice Complete</h1>
          <p className="text-xs text-gray-400">Great job! You've rated {selectedCards.length} phrases.</p>
        </header>

        <div className="glass-panel p-8 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold text-white">Session finished</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Your memory recall has been saved and your SRS schedule updated.
          </p>
          <div className="pt-2">
            <Link 
              to="/" 
              className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all shadow"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'rating') {
    const currentImp = improvements[currentIndex];
    const progress = ((currentIndex) / selectedCards.length) * 100;

    return (
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in py-4">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Rate Recall</h1>
            <p className="text-xs text-gray-400 mt-0.5">How easy was it to use this phrase naturally?</p>
          </div>
          <div className="text-xs font-bold text-gray-400">
            {currentIndex + 1} / {selectedCards.length}
          </div>
        </header>

        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div 
            className="h-full bg-purple-500 transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="pl-3 border-l-2 border-purple-500">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">Target Construction</div>
            <div className="text-xl font-bold text-white">
              "{currentImp?.construction || currentImp?.improved || 'Target Phrase'}"
            </div>
          </div>

          {currentImp?.improved && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                <span>Example / Natural Usage</span>
                <AudioPlayerButton text={currentImp.improved} settings={settings} size="sm" />
              </div>
              <div className="text-sm text-emerald-400 font-medium">
                "{currentImp.improved}"
              </div>
            </div>
          )}

          {currentImp?.original && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Original Wording</div>
              <div className="text-sm text-rose-400 line-through opacity-80 font-medium">
                "{currentImp.original}"
              </div>
            </div>
          )}

          {currentImp?.explanation && (
            <div className="pt-2 border-t border-gray-800">
              <div className="text-xs text-gray-300 italic bg-gray-900/60 p-3 rounded border border-gray-800">
                {currentImp.explanation}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {RATINGS.map((r) => (
            <button
              key={r.score}
              onClick={() => handleRate(r.score)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#151622] border border-gray-800 hover:border-purple-500 transition-all cursor-pointer"
            >
              <span className="font-bold text-sm" style={{ color: r.color }}>
                {r.label}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 text-center">
                {r.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Interactive Seamless AI Session for Translation Practice
  if (practiceType === 'translation' && translationSubMode === 'seamless') {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-2">
        {/* Practice Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11121c] p-2 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPracticeType('translation')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                practiceType === 'translation'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌐 Translation Practice
            </button>
            <button
              onClick={() => setPracticeType('scenario')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                practiceType === 'scenario'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💬 Scenario Q&A (Prompt #3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTranslationSubMode('seamless')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                translationSubMode === 'seamless'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ✨ Seamless AI
            </button>
            <button
              onClick={() => setTranslationSubMode('prompt')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                translationSubMode === 'prompt'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📋 Copy Prompt #5
            </button>
          </div>
        </div>

        <TranslationPracticeSession
          allCards={improvements}
          settings={settings}
          onFinish={(practicedCards) => startRating(practicedCards)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-2">
      {/* Mode Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11121c] p-2 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPracticeType('translation')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              practiceType === 'translation'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌐 Translation Practice
          </button>
          <button
            onClick={() => setPracticeType('scenario')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              practiceType === 'scenario'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💬 Scenario Q&A (Prompt #3)
          </button>
        </div>

        {practiceType === 'translation' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTranslationSubMode('seamless')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                translationSubMode === 'seamless'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ✨ Seamless AI
            </button>
            <button
              onClick={() => setTranslationSubMode('prompt')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                translationSubMode === 'prompt'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-600'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📋 Copy Prompt #5
            </button>
          </div>
        )}
      </div>

      {practiceType === 'translation' ? (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              Russian Translation Practice (Prompt #5)
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Copy Prompt #5 to your LLM (ChatGPT, Claude, Gemini). The LLM will generate Russian passages with highlighted target constructions across 4-5 rounds. Translate them to English!
            </p>
          </header>

          <div className="glass-panel p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Prompt #5 • {improvements.length} Targeted Phrases
              </div>
              <button
                id="btn-copy-prompt-5"
                onClick={() => handleCopy(translationPromptText)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? 'Copied! ✓' : 'Copy Prompt #5'}
              </button>
            </div>

            <div className="bg-[#0e0f17] border border-gray-800 rounded-lg p-3.5">
              <textarea
                readOnly
                value={translationPromptText}
                className="w-full h-80 bg-transparent text-gray-300 text-xs font-mono leading-relaxed resize-y focus:outline-none"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              Russian Scenario Practice Mode
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Copy Prompt #3 to your LLM (ChatGPT, Claude, Gemini). The LLM will ask you 5 scenario questions in Russian. Answer them in English using your targeted constructions!
            </p>
          </header>

          <div className="glass-panel p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Prompt #3 • {improvements.length} Due {improvements.length === 1 ? 'Phrase' : 'Phrases'}
              </div>
              <button
                id="btn-copy-prompt"
                onClick={() => handleCopy(promptText)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? 'Copied! ✓' : 'Copy Prompt #3'}
              </button>
            </div>

            <div className="bg-[#0e0f17] border border-gray-800 rounded-lg p-3.5">
              <textarea
                readOnly
                value={promptText}
                className="w-full h-80 bg-transparent text-gray-300 text-xs font-mono leading-relaxed resize-y focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button
          id="btn-done-practicing"
          onClick={() => startRating(improvements)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow cursor-pointer"
        >
          I'm Done Practicing → Rate Recall
        </button>
      </div>
    </div>
  );
}
