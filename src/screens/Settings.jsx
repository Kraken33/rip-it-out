import { useState, useEffect, useRef } from 'react';
import { 
  getSettings, updateSettings, getStats,
  exportAllData, importData, clearAllData
} from '../store';

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
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 text-sm rounded-[var(--radius-md)] transition-colors ${
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSettings(getSettings());
    setStats(getStats());
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleExport = () => {
    const data = exportAllData();
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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        if (importMode === 'replace') {
          if (!window.confirm("This will replace ALL existing data. Are you sure?")) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }
        
        const success = importData(jsonData, importMode);
        if (success) {
          alert('Data imported successfully!');
          loadData();
        } else {
          alert('Failed to import data. Invalid format.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (dangerConfirmStep === 0) {
      setDangerConfirmStep(1);
    } else {
      clearAllData();
      alert('All data deleted successfully.');
      setDangerConfirmStep(0);
      loadData();
    }
  };

  if (!settings) return null;

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
            value={settings.defaultReviewMode || 'Flashcard'}
            onChange={(val) => handleSettingChange('defaultReviewMode', val)}
            options={[
              { label: 'Flashcard', value: 'Flashcard' },
              { label: 'Conversation', value: 'Conversation' }
            ]}
          />
        </div>
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
