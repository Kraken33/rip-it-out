import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getSettings, updateSettings, getStats,
  exportAllData, importData, clearAllData
} from '../store';
import { validateGroqKey, validateOpenAIKey } from '../services/aiService';

function PillGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 text-sm rounded-[var(--radius-md)] transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--bg-base)] font-medium glow'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ sessions: 0, improvements: 0, srsCards: 0 });
  const [importMode, setImportMode] = useState('merge');
  const [dangerConfirmStep, setDangerConfirmStep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Key Inputs Local State
  const [groqInput, setGroqInput] = useState('');
  const [openaiInput, setOpenaiInput] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [keysSavedStatus, setKeysSavedStatus] = useState(false);

  // Connection Test States
  const [groqTest, setGroqTest] = useState({ testing: false, valid: null, error: '' });
  const [openaiTest, setOpenaiTest] = useState({ testing: false, valid: null, error: '' });

  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [st, stts] = await Promise.all([getSettings(), getStats()]);
      setSettings(st);
      setGroqInput(st.groqApiKey || '');
      setOpenaiInput(st.openaiApiKey || '');
      setStats(stts);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const handleSaveKeys = async (e) => {
    if (e) e.preventDefault();
    const newSettings = {
      ...settings,
      groqApiKey: groqInput.trim(),
      openaiApiKey: openaiInput.trim(),
    };
    setSettings(newSettings);
    await updateSettings(newSettings);
    setKeysSavedStatus(true);
    setTimeout(() => setKeysSavedStatus(false), 3000);
  };

  const handleTestGroq = async () => {
    const keyToTest = groqInput.trim();
    if (!keyToTest) {
      setGroqTest({ testing: false, valid: false, error: 'Please enter a Groq API Key first.' });
      return;
    }
    setGroqTest({ testing: true, valid: null, error: '' });
    const isValid = await validateGroqKey(keyToTest);
    setGroqTest({
      testing: false,
      valid: isValid,
      error: isValid ? '' : 'Invalid API key or network error.',
    });
    if (isValid) {
      const saved = await updateSettings({ groqApiKey: keyToTest });
      setSettings(saved);
      setGroqInput(saved.groqApiKey || '');
      setKeysSavedStatus(true);
      setTimeout(() => setKeysSavedStatus(false), 3000);
    }
  };

  const handleTestOpenAI = async () => {
    const keyToTest = openaiInput.trim();
    if (!keyToTest) {
      setOpenaiTest({ testing: false, valid: false, error: 'Please enter an OpenAI API Key first.' });
      return;
    }
    setOpenaiTest({ testing: true, valid: null, error: '' });
    const isValid = await validateOpenAIKey(keyToTest);
    setOpenaiTest({
      testing: false,
      valid: isValid,
      error: isValid ? '' : 'Invalid API key or network error.',
    });
    if (isValid) {
      const saved = await updateSettings({ openaiApiKey: keyToTest });
      setSettings(saved);
      setOpenaiInput(saved.openaiApiKey || '');
      setKeysSavedStatus(true);
      setTimeout(() => setKeysSavedStatus(false), 3000);
    }
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rip-it-out-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        if (importMode === 'replace') {
          if (!window.confirm("This will replace ALL existing data. Are you sure?")) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }
        
        await importData(jsonData, importMode);
        alert('Data imported successfully!');
        await loadData();
      } catch (err) {
        alert('Error parsing or importing JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (dangerConfirmStep === 0) {
      setDangerConfirmStep(1);
    } else {
      await clearAllData();
      alert('All data deleted successfully.');
      setDangerConfirmStep(0);
      await loadData();
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
        <svg className="animate-spin h-8 w-8 text-purple-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 animate-fade-in py-4">
      <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">Settings & Preferences</h1>

      {/* Prompt Preferences */}
      <section className="glass p-8 sm:p-10 rounded-[var(--radius-xl)] space-y-8 border border-[var(--border-subtle)] shadow-xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-4">Prompt Customization</h2>
        
        <div className="space-y-6">
          <PillGroup
            label="Formality Level"
            value={settings.formality || 'Casual'}
            onChange={(val) => handleSettingChange('formality', val)}
            options={[
              { label: 'Casual', value: 'Casual' },
              { label: 'Neutral', value: 'Neutral' },
              { label: 'Semi-formal', value: 'Semi-formal' }
            ]}
          />

          <PillGroup
            label="Self-assessed Level"
            value={settings.level || 'Intermediate'}
            onChange={(val) => handleSettingChange('level', val)}
            options={[
              { label: 'Beginner', value: 'Beginner' },
              { label: 'Intermediate', value: 'Intermediate' },
              { label: 'Advanced', value: 'Advanced' }
            ]}
          />

          <PillGroup
            label="Focus Area"
            value={settings.focusArea || 'All'}
            onChange={(val) => handleSettingChange('focusArea', val)}
            options={[
              { label: 'All', value: 'All' },
              { label: 'Vocabulary', value: 'Vocabulary' },
              { label: 'Grammar', value: 'Grammar' },
              { label: 'Collocations', value: 'Collocations' },
              { label: 'Idioms', value: 'Idioms' }
            ]}
          />

          <PillGroup
            label="Max Improvements per Session"
            value={settings.maxImprovements || 5}
            onChange={(val) => handleSettingChange('maxImprovements', val)}
            options={[
              { label: '3 items', value: 3 },
              { label: '5 items', value: 5 }
            ]}
          />

          <PillGroup
            label="Default Review Mode"
            value={settings.practiceMode || 'Flashcard'}
            onChange={(val) => handleSettingChange('practiceMode', val)}
            options={[
              { label: 'Flashcard', value: 'Flashcard' },
              { label: 'Conversation', value: 'Conversation' }
            ]}
          />
        </div>
      </section>

      {/* AI Integrations & API Keys */}
      <section className="glass p-8 sm:p-10 rounded-[var(--radius-xl)] space-y-8 border border-[var(--border-subtle)] shadow-xl">
        <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">AI Integrations & Audio</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Configure optional API keys to enable 1-click in-app voice coaching and realistic text-to-speech.</p>
          </div>
          <span className="text-xs px-3 py-1 bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-semibold rounded-full w-fit">
            Client-side API Keys
          </span>
        </div>

        <form onSubmit={handleSaveKeys} className="space-y-6">
          <PillGroup
            label="Default Session Interaction Mode"
            value={settings.defaultMode || 'seamless'}
            onChange={(val) => handleSettingChange('defaultMode', val)}
            options={[
              { label: '✨ Seamless AI (1-Click)', value: 'seamless' },
              { label: '📋 Prompt Copy/Paste', value: 'prompt' }
            ]}
          />

          {/* Groq API Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="groq-key-input" className="block text-sm font-medium text-[var(--text-secondary)]">
                Groq API Key <span className="text-xs text-[var(--accent)] font-normal">(Speech-to-Text only — optional, powers Whisper voice input)</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--accent)] hover:underline font-semibold"
              >
                Get Free Groq Key ↗
              </a>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="groq-key-input"
                  type={showGroqKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={groqInput}
                  onChange={(e) => setGroqInput(e.target.value)}
                  onBlur={() => handleSaveKeys()}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-[var(--radius-md)] text-sm font-mono focus:outline-none focus:border-[var(--accent)] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showGroqKey ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestGroq}
                disabled={groqTest.testing}
                className="px-4 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs rounded-[var(--radius-md)] transition-all cursor-pointer whitespace-nowrap"
              >
                {groqTest.testing ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {groqTest.valid !== null && (
              <p className={`text-xs font-semibold ${groqTest.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {groqTest.valid ? '✅ Groq API key is valid and working!' : `❌ ${groqTest.error}`}
              </p>
            )}
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="openai-key-input" className="block text-sm font-medium text-[var(--text-secondary)]">
                OpenAI API Key <span className="text-xs text-[var(--accent)] font-normal">(Required for Seamless AI text generation, evaluation & Neural TTS)</span>
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--accent)] hover:underline font-semibold"
              >
                Get OpenAI Key ↗
              </a>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="openai-key-input"
                  type={showOpenAIKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={openaiInput}
                  onChange={(e) => setOpenaiInput(e.target.value)}
                  onBlur={() => handleSaveKeys()}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-[var(--radius-md)] text-sm font-mono focus:outline-none focus:border-[var(--accent)] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showOpenAIKey ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestOpenAI}
                disabled={openaiTest.testing}
                className="px-4 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs rounded-[var(--radius-md)] transition-all cursor-pointer whitespace-nowrap"
              >
                {openaiTest.testing ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {openaiTest.valid !== null && (
              <p className={`text-xs font-semibold ${openaiTest.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {openaiTest.valid ? '✅ OpenAI API key is valid and working!' : `❌ ${openaiTest.error}`}
              </p>
            )}
          </div>

          {/* OpenAI Chat Model Selector */}
          <PillGroup
            label="OpenAI Chat Model"
            value={settings.openaiModel || 'gpt-4o-mini'}
            onChange={(val) => handleSettingChange('openaiModel', val)}
            options={[
              { label: 'gpt-4o-mini (Fast & Cheap)', value: 'gpt-4o-mini' },
              { label: 'gpt-4o (Higher Quality)', value: 'gpt-4o' },
            ]}
          />

          {/* TTS Engine Selector */}
          <PillGroup
            label="Text-to-Speech Engine"
            value={settings.ttsEngine || 'browser'}
            onChange={(val) => handleSettingChange('ttsEngine', val)}
            options={[
              { label: '🌐 Browser Default (Free)', value: 'browser' },
              { label: '🎙️ OpenAI Neural TTS (High Quality)', value: 'openai' }
            ]}
          />

          {settings.ttsEngine === 'openai' && (
            <PillGroup
              label="OpenAI Voice"
              value={settings.ttsVoice || 'alloy'}
              onChange={(val) => handleSettingChange('ttsVoice', val)}
              options={[
                { label: 'Alloy (Neutral)', value: 'alloy' },
                { label: 'Nova (Warm)', value: 'nova' },
                { label: 'Shimmer (Clear)', value: 'shimmer' },
                { label: 'Onyx (Deep)', value: 'onyx' },
                { label: 'Echo (Calm)', value: 'echo' },
                { label: 'Fable (Expressive)', value: 'fable' }
              ]}
            />
          )}

          {/* Save Button & Feedback */}
          <div className="pt-2 flex items-center gap-4">
            <button
              id="btn-save-keys"
              type="submit"
              className="bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white px-6 py-3.5 rounded-[var(--radius-md)] font-bold text-sm transition-all shadow-[0_0_15px_hsla(262,83%,65%,0.3)] cursor-pointer"
            >
              Save API Keys &amp; Preferences
            </button>
            {keysSavedStatus && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-fade-in">
                Saved! ✓
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Data Management */}
      <section className="glass p-8 sm:p-10 rounded-[var(--radius-xl)] space-y-8 border border-[var(--border-subtle)] shadow-xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-4">Data Management & Backup</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)] text-center space-y-1">
            <div className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.totalSessions || stats.sessions || 0}</div>
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sessions</div>
          </div>
          <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)] text-center space-y-1">
            <div className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.totalImprovements || stats.improvements || 0}</div>
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Improvements</div>
          </div>
          <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)] text-center space-y-1">
            <div className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.dueToday || 0}</div>
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Due Today</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={handleExport}
            className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-glow)] px-6 py-4 rounded-2xl font-bold transition-all shadow-[0_0_15px_hsla(262,83%,65%,0.3)] cursor-pointer text-center"
          >
            Export Backup (JSON)
          </button>
          
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex bg-[var(--bg-elevated)] rounded-xl p-1 border border-[var(--border-subtle)]">
              <button
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${importMode === 'merge' ? 'bg-[var(--accent)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                onClick={() => setImportMode('merge')}
              >
                Merge Backup
              </button>
              <button
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${importMode === 'replace' ? 'bg-[var(--danger)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                onClick={() => setImportMode('replace')}
              >
                Replace All
              </button>
            </div>
            <button
              onClick={handleImportClick}
              className="w-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-4 rounded-2xl font-bold transition-all cursor-pointer hover:border-[var(--accent)] text-center"
            >
              Import JSON File
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="glass p-8 sm:p-10 rounded-[var(--radius-xl)] border border-[var(--danger)]/50 space-y-6 shadow-xl">
        <h2 className="text-2xl font-bold text-[var(--danger)] border-b border-[var(--danger)]/20 pb-4">Danger Zone</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          Deleting your local vault will wipe out all session logs, improvements, and spaced repetition data permanently. Make sure to export a JSON backup first if needed.
        </p>
        
        <button
          onClick={handleClearData}
          className={`w-full px-6 py-4 rounded-2xl font-extrabold text-base transition-all cursor-pointer ${
            dangerConfirmStep === 0
              ? 'bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white'
              : 'bg-[var(--danger)] text-white animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]'
          }`}
        >
          {dangerConfirmStep === 0 ? 'Delete All Vault Data' : 'Are you sure? Click again to confirm permanent deletion.'}
        </button>
      </section>
    </div>
  );
}
