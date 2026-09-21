import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createSession, 
  addImprovements, 
  addSessionText,
  getSettings,
  getSessions,
  logActivity
} from '../store';
import { 
  generateDescriptionPrompt, 
  generateExportPrompt, 
  parseImportJSON 
} from '../prompts';
import { generateSeamlessSessionFeedback } from '../services/aiService';
import ModeToggle from '../components/ModeToggle';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayerButton from '../components/AudioPlayerButton';
import SeamlessChatSession from './SeamlessChatSession';

const SOURCE_TYPES = [
  { id: 'video', label: 'Video', icon: '▶️' },
  { id: 'podcast', label: 'Podcast', icon: '🎧' },
  { id: 'article', label: 'Article', icon: '📄' },
  { id: 'book', label: 'Book', icon: '📚' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export default function Session() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState(null);
  const [mode, setMode] = useState('seamless');
  const [existingSessions, setExistingSessions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seamlessError, setSeamlessError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [st, sess] = await Promise.all([getSettings(), getSessions()]);
        if (isMounted) {
          setSettings(st);
          setExistingSessions(sess);
          setMode(st?.defaultMode || 'seamless');
        }
      } catch (err) {
        console.error('Error loading session screen data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 1 State
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // Map of unique previous titles with their most recent session data
  const previousTitlesMap = useMemo(() => {
    const map = new Map();
    existingSessions.forEach((s) => {
      if (s.title && !map.has(s.title)) {
        map.set(s.title, s);
      }
    });
    return Array.from(map.values());
  }, [existingSessions]);

  const autofillFromSession = useCallback((selectedTitle) => {
    if (!selectedTitle) return;
    const match = existingSessions.find((s) => s.title === selectedTitle);
    if (match) {
      setTitle(match.title);
      if (match.sourceType) setSourceType(match.sourceType);
      if (match.tags && Array.isArray(match.tags)) setTags(match.tags.join(', '));
      if (match.notes) setNotes(match.notes || '');
    }
  }, [existingSessions]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const match = existingSessions.find((s) => s.title.toLowerCase() === val.toLowerCase().trim());
    if (match) {
      if (match.sourceType) setSourceType(match.sourceType);
      if (match.tags && Array.isArray(match.tags)) setTags(match.tags.join(', '));
      if (match.notes) setNotes(match.notes || '');
    }
  };

  // Data State
  const [session, setSession] = useState(null);
  const [descriptionText, setDescriptionText] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [parseWarnings, setParseWarnings] = useState([]);
  const [parsedImprovements, setParsedImprovements] = useState([]);

  // Copy Feedback
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  const handleCreateSession = useCallback(async (e) => {
    e.preventDefault();
    if (!title || !sourceType) return;

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);
      const newSession = await createSession({
        title,
        sourceType,
        tags: tagArray,
        notes,
      });
      setSession(newSession);
      setStartTime(Date.now());
      setStep(2);
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  }, [title, sourceType, tags, notes]);

  const copyToClipboard = useCallback(async (text, setter) => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [startTime]);

  const handleSeamlessSubmit = async (userText) => {
    if (!userText || !userText.trim()) return;
    setSeamlessError('');
    setLoading(true);

    try {
      const res = await generateSeamlessSessionFeedback(session, settings, userText);
      setParsedImprovements(res.improvements);
      setRawTextInput(userText);
      setStep(4);
    } catch (err) {
      console.error('Seamless AI processing error:', err);
      setSeamlessError(err.message || 'Failed to process AI improvements.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = useCallback(() => {
    setParseError('');
    setParseWarnings([]);

    const result = parseImportJSON(jsonInput);
    if (!result.success) {
      setParseError(result.error);
      return;
    }

    if (result.warnings) {
      setParseWarnings(result.warnings);
    }

    setParsedImprovements(result.improvements);
    setStep(4);
  }, [jsonInput]);

  const handleConfirmImport = useCallback(async () => {
    if (session && parsedImprovements.length > 0) {
      try {
        setLoading(true);
        if (rawTextInput.trim()) {
          await addSessionText(session.id, rawTextInput.trim());
        }
        await addImprovements(session.id, parsedImprovements);
        if (startTime) {
          const durationSeconds = Math.round((Date.now() - startTime) / 1000);
          if (durationSeconds > 0) {
            await logActivity({
              type: 'session',
              durationSeconds,
              sessionId: session.id,
              topicId: session.topicId,
            });
          }
        }
        navigate('/');
      } catch (err) {
        console.error('Error confirming import:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [session, parsedImprovements, rawTextInput, startTime, navigate]);

  // Derived Prompts
  const descriptionPrompt = useMemo(() => {
    if (!session || !settings) return '';
    return generateDescriptionPrompt(session, settings);
  }, [session, settings]);

  const exportPrompt = useMemo(() => {
    return generateExportPrompt();
  }, []);

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-2xl mx-auto py-2">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">New Practice Session</h1>
          <ModeToggle mode={mode} onChange={setMode} settings={settings} />
        </div>

        {/* Progress Indicator */}
        <div className="pt-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-800 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {[1, 2, 3, 4].map((num) => (
              <div 
                key={num} 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= num 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>1. Details</span>
            <span>2. Describe</span>
            <span>3. Export</span>
            <span>4. Import</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleCreateSession} className="glass-panel p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="title" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Title <span className="text-rose-400">*</span>
              </label>
              {previousTitlesMap.length > 0 && (
                <select
                  id="select-prev-title"
                  value=""
                  onChange={(e) => autofillFromSession(e.target.value)}
                  className="bg-[#1b1c2b] border border-[#27283d] text-purple-400 font-semibold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="" disabled>📋 Autofill from previous title...</option>
                  {previousTitlesMap.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title} ({s.sourceType})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <input
              id="title"
              type="text"
              list="previous-title-list"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Atomic Habits Chapter 3 / Tech Video"
              className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
              required
            />
            {previousTitlesMap.length > 0 && (
              <datalist id="previous-title-list">
                {previousTitlesMap.map((s) => (
                  <option key={s.id} value={s.title} />
                ))}
              </datalist>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Source Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {SOURCE_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSourceType(type.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    sourceType === type.id
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold'
                      : 'border-gray-800 bg-[#1b1c2b] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tags" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Tags <span className="text-gray-500 font-normal lowercase">(comma-separated)</span>
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="productivity, video, tech"
              className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              Notes <span className="text-gray-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context about this session..."
              rows={2}
              className="w-full bg-[#1b1c2b] border border-[#27283d] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-all resize-none font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-generate-prompt"
              type="submit"
              disabled={!title || !sourceType || loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Session...' : mode === 'seamless' ? 'Start Seamless Voice Session →' : 'Generate Prompt #1 (Description) →'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && mode === 'seamless' && (
        <SeamlessChatSession session={session} settings={settings} />
      )}

      {step === 2 && mode === 'prompt' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Step 1: Describe Content</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Copy prompt to LLM and describe what you {SOURCE_TYPES.find((t) => t.id === session?.sourceType)?.label?.toLowerCase() || 'consumed'}.
                </p>
              </div>
              <button
                id="btn-copy-prompt-1"
                onClick={() => copyToClipboard(descriptionPrompt, setCopied1)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {copied1 ? 'Copied! ✓' : 'Copy Prompt #1'}
              </button>
            </div>

            <div className="bg-[#0e0f17] border border-gray-800 rounded-lg p-3.5">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {descriptionPrompt}
              </pre>
            </div>
          </div>

          <button
            id="btn-next-step-3"
            onClick={() => setStep(3)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all text-center cursor-pointer shadow"
          >
            I Got My Improvements → Step 2
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Step 2: Export JSON</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Send Prompt #2 in the SAME LLM conversation to get JSON output.
                </p>
              </div>
              <button
                id="btn-copy-prompt-2"
                onClick={() => copyToClipboard(exportPrompt, setCopied2)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {copied2 ? 'Copied! ✓' : 'Copy Prompt #2'}
              </button>
            </div>

            <div className="bg-[#0e0f17] border border-gray-800 rounded-lg p-3.5">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                {exportPrompt}
              </pre>
            </div>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="json-input" className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Paste LLM JSON Output <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"improvements": [...]}'
                rows={5}
                className="w-full bg-[#0e0f17] border border-gray-800 rounded-lg p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-purple-500 transition-all resize-y"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label htmlFor="raw-text-input" className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>My Conversation Text <span className="text-gray-500 font-normal lowercase">(optional)</span></span>
                <span className="text-[10px] text-purple-400 font-normal">📝 Enables word metrics &amp; interactive viewer</span>
              </label>
              <textarea
                id="raw-text-input"
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder="Paste your messages from the conversation here..."
                rows={4}
                className="w-full bg-[#0e0f17] border border-gray-800 rounded-lg p-3 text-xs text-gray-200 font-sans focus:outline-none focus:border-purple-500 transition-all resize-y"
              />
            </div>

            {parseError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <p className="font-bold mb-0.5">Import Error</p>
                <p>{parseError}</p>
              </div>
            )}

            <button
              id="btn-import-json"
              onClick={handleImport}
              disabled={!jsonInput.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow"
            >
              Parse & Preview Improvements →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Review & Confirm</h2>
              <p className="text-xs text-gray-400">
                Ready to import {parsedImprovements.length} improvements into your vault.
              </p>
            </div>
            <button
              id="btn-confirm-import"
              onClick={handleConfirmImport}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Import'}
            </button>
          </div>

          {parseWarnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs space-y-1">
              <p className="font-bold">Warnings</p>
              {parseWarnings.map((w, i) => <p key={i}>• {w}</p>)}
            </div>
          )}

          <div className="space-y-3">
            {parsedImprovements.map((imp, idx) => (
              <div key={idx} className="glass-panel p-4 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                      {imp.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                      {imp.spoken_frequency?.replace('_', ' ')} freq
                    </span>
                  </div>
                  <AudioPlayerButton text={imp.improved || imp.construction} settings={settings} size="sm" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Construction Pattern:</span>
                  <p className="text-base font-extrabold text-purple-300 text-glow">
                    "{imp.construction || imp.improved}"
                  </p>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-2">
                    <span>Example: "{imp.improved}"</span>
                  </p>
                  <p className="text-xs text-rose-400 line-through opacity-80 pt-0.5">
                    Original: "{imp.original}"
                  </p>
                </div>

                <p className="text-xs text-gray-300 bg-gray-900/60 p-2.5 rounded border border-gray-800">
                  <span className="font-bold text-white">Why: </span>{imp.explanation}
                </p>
              </div>
            ))}
          </div>

          <button
            id="btn-confirm-import-bottom"
            onClick={handleConfirmImport}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Confirm Import'}
          </button>
        </div>
      )}
    </div>
  );
}
