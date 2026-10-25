import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getPracticeCards, 
  getImprovement, 
  updateSrsCard, 
  getSettings,
  getSession,
  createSession,
  logActivity
} from '../store';
import { processReview, RATINGS } from '../srs';
import AudioPlayerButton from '../components/AudioPlayerButton';
import PracticeHeader from '../components/PracticeHeader';
import TranslationPracticeSession from './TranslationPracticeSession';

export default function Practice() {
  const navigate = useNavigate();
  const [step, setStep] = useState('loading');
  const [selectedCards, setSelectedCards] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [settings, setSettings] = useState(null);
  const [inlineRatedCardIds, setInlineRatedCardIds] = useState(() => new Set());

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const practiceCards = await getPracticeCards(20, 20);
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

        if (isMounted) {
          setSettings(st);
          setStep('practice');
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

  const handleInlineRateCard = useCallback(async (cardItem, score) => {
    const targetId = cardItem?.improvementId || cardItem?.id;
    const srsCard = selectedCards.find((c) => c.improvementId === targetId || c.id === targetId);
    if (srsCard) {
      const updates = processReview(srsCard, score);
      await updateSrsCard(srsCard.improvementId, updates);
      setInlineRatedCardIds((prev) => new Set(prev).add(srsCard.improvementId));
    }
  }, [selectedCards]);

  const startRating = useCallback(async (customCards, roundPayload = [], options = {}) => {
    const hasRounds = Array.isArray(roundPayload) && roundPayload.length > 0;
    const submittedTranslations = hasRounds
      ? roundPayload
          .map((r) => (typeof r?.translationText === 'string' ? r.translationText.trim() : ''))
          .filter(Boolean)
      : [];

    if (hasRounds && submittedTranslations.length > 0) {
      const durationSeconds = startTime ? Math.max(0, Math.round((Date.now() - startTime) / 1000)) : 0;
      const orderedRounds = [...roundPayload].sort((a, b) => (a.roundIndex ?? 0) - (b.roundIndex ?? 0));
      const distinctConstructions = [];
      const seenConstructions = new Set();
      orderedRounds.forEach((r) =>
        (r.cards || []).forEach((c) => {
          const key = c.id ?? c.improvementId ?? c.construction;
          if (key && !seenConstructions.has(key)) {
            seenConstructions.add(key);
            distinctConstructions.push(c.construction || c.improved || String(key));
          }
        })
      );
      const dateLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const sessionMessages = [];
      const verdictSummaries = [];
      orderedRounds.forEach((r) => {
        if (r.passageText) {
          sessionMessages.push({ role: 'assistant', content: r.passageText });
        }
        if (r.translationText) {
          sessionMessages.push({ role: 'user', content: r.translationText });
        }
        const perTarget = Array.isArray(r.verdict?.constructions)
          ? r.verdict.constructions
              .map((c) => `${c.used ? (c.quality === 'awkward' ? '~' : '✓') : '✗'} ${c.target}`)
              .join('; ')
          : '';
        const feedback = r.verdict?.summary || r.rawFeedback || '';
        if (feedback || perTarget) {
          sessionMessages.push({
            role: 'assistant',
            content: [feedback, perTarget].filter(Boolean).join('\n'),
          });
        }
        if (feedback) verdictSummaries.push(feedback);
      });

      try {
        const firstImp = improvements[0];
        const originSession = firstImp ? await getSession(firstImp.sessionId) : null;
        const saved = await createSession({
          title: `Translation Practice — ${dateLabel} — ${orderedRounds.length} rounds · ${distinctConstructions.length} constructions`,
          sourceType: 'translation-practice',
          tags: ['translation', 'russian-practice'],
          notes: [
            `Practiced: ${distinctConstructions.join(' | ') || '—'}`,
            verdictSummaries.length > 0 ? `Feedback: ${verdictSummaries.join(' / ')}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          durationSeconds,
          rawText: submittedTranslations.join('\n\n'),
          messages: sessionMessages,
        });
        if (durationSeconds > 0) {
          await logActivity({
            type: 'session',
            durationSeconds,
            sessionId: saved?.id || null,
            topicId: saved?.topicId ?? originSession?.topicId ?? null,
          });
        }
      } catch (err) {
        console.error('Error saving translation practice session:', err);
      }
      if (startTime) {
        setStartTime(null);
      }
    } else if (startTime) {
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

    if (options?.ratedInline) {
      setStep('complete');
      return;
    }

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
  }, [startTime, improvements, selectedCards, inlineRatedCardIds]);

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
          <h2 className="text-xl font-bold text-white">You're all caught up!</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You don't have any due cards right now. Check back later or add more constructions from your sessions.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/session/new"
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl transition border border-gray-700"
            >
              New Session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fade-in py-8">
        <div className="glass-panel p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">Session finished</h2>
          <p className="text-xs text-gray-400">
            Great work! All practiced phrases have been updated in your spaced repetition queue.
          </p>
          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              to="/"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow text-center"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/review"
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-xl transition text-center border border-gray-700"
            >
              Review Flashcards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'rating') {
    const currentCard = selectedCards[currentIndex];
    const currentImp = improvements.find((i) => i.id === currentCard?.improvementId) || {};

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

        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Target Construction</span>
            <h3 className="text-xl font-bold text-white leading-snug">
              "{currentImp.construction || currentImp.improved}"
            </h3>
            {currentImp.improved && (
              <p className="text-xs text-gray-300 italic flex items-center justify-between gap-2">
                <span>Example: "{currentImp.improved}"</span>
                <AudioPlayerButton text={currentImp.improved} settings={settings} size="sm" />
              </p>
            )}
            {currentImp.original && (
              <p className="text-xs text-gray-400">
                Original: <span className="line-through text-rose-400/80">"{currentImp.original}"</span>
              </p>
            )}
            {currentImp.explanation && (
              <p className="text-xs text-gray-400 bg-[#0e0f17] p-2.5 rounded-lg border border-gray-800">
                {currentImp.explanation}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {RATINGS.map((r) => (
              <button
                key={r.score}
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
                <span className={`text-xs font-bold ${
                  r.score === 1 ? 'text-rose-400' : r.score === 2 ? 'text-amber-400' : r.score === 3 ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {r.label}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 text-center">
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Card-Style Seamless AI Session for Translation Practice
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-2">
      <PracticeHeader activeMode="translation" />

      <TranslationPracticeSession
        allCards={improvements}
        settings={settings}
        onRateCard={handleInlineRateCard}
        onFinish={(roundPayload, practicedCards, options) => startRating(practicedCards, roundPayload, options)}
        onExit={() => navigate('/')}
      />
    </div>
  );
}
