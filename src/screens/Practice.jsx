import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getDueCards, 
  getImprovement, 
  updateSrsCard, 
  getSettings,
  getSession,
  logActivity
} from '../store';
import { processReview, RATINGS } from '../srs';
import { generatePracticePrompt } from '../prompts';

export default function Practice() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('loading');
  const [selectedCards, setSelectedCards] = useState([]);
  const [improvements, setImprovements] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const loadData = () => {
      const allDue = getDueCards();
      
      if (allDue.length === 0) {
        setStep('empty');
        return;
      }
      
      const sorted = [...allDue].sort((a, b) => (a.easeFactor || 2.5) - (b.easeFactor || 2.5));
      const top5 = sorted.slice(0, 5);
      
      const imps = top5.map(card => getImprovement(card.improvementId)).filter(Boolean);
      
      if (imps.length === 0) {
        setStep('empty');
        return;
      }
      
      setSelectedCards(top5);
      setImprovements(imps);
      
      const settings = getSettings();
      const prompt = generatePracticePrompt(imps, settings);
      setPromptText(prompt);
      
      setStep('prompt');
      setStartTime(Date.now());
    };
    
    loadData();
  }, []);

  const handleCopy = useCallback(() => {
    if (!startTime) setStartTime(Date.now());
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [promptText, startTime]);

  const startRating = useCallback(() => {
    if (startTime) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        const firstImp = improvements[0];
        const session = firstImp ? getSession(firstImp.sessionId) : null;
        logActivity({
          type: 'session',
          durationSeconds,
          sessionId: session?.id || null,
          topicId: session?.topicId || null,
        });
      }
    }
    setStep('rating');
    setCurrentIndex(0);
  }, [startTime, improvements]);

  const handleRate = useCallback((score) => {
    const card = selectedCards[currentIndex];
    const updates = processReview(card, score);
    updateSrsCard(card.improvementId, updates);
    
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
              "{currentImp.construction || currentImp.improved}"
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Example / Natural Usage</div>
            <div className="text-sm text-emerald-400 font-medium">
              "{currentImp.improved}"
            </div>
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Original Wording</div>
          <div className="text-sm text-rose-400 line-through opacity-80 font-medium">
            "{currentImp.original}"
          </div>
          
          {currentImp.explanation && (
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-2">
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
            onClick={handleCopy}
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

      <div className="flex justify-end">
        <button
          id="btn-done-practicing"
          onClick={startRating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow cursor-pointer"
        >
          I'm Done Practicing → Rate Recall
        </button>
      </div>
    </div>
  );
}
