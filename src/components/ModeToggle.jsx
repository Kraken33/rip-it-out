export default function ModeToggle({ mode, onChange, settings, showWarningBanner = true, className = '' }) {
  const hasKey = Boolean(settings?.groqApiKey?.trim() || settings?.openaiApiKey?.trim());

  const handleSelect = (selectedMode) => {
    onChange(selectedMode);
  };

  const showBanner = showWarningBanner && !hasKey && mode === 'seamless';

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <div className="inline-flex bg-[var(--bg-elevated)] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
        <button
          type="button"
          onClick={() => handleSelect('seamless')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            mode === 'seamless'
              ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_hsla(262,83%,65%,0.4)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>✨ Seamless AI</span>
          {!hasKey && <span className="text-[10px] opacity-75 font-normal">(No Key)</span>}
        </button>

        <button
          type="button"
          onClick={() => handleSelect('prompt')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            mode === 'prompt'
              ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_hsla(262,83%,65%,0.4)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>📋 Prompt Copy/Paste</span>
        </button>
      </div>

      {/* Reserve stable space — banner only shows when no key + seamless mode */}
      <div className="h-[30px] flex items-start justify-end w-full overflow-hidden">
        {showBanner && (
          <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5 max-w-xs text-left animate-fade-in">
            <span className="shrink-0">⚠️</span>
            <span>Add a Groq or OpenAI key in Settings to unlock.</span>
          </div>
        )}
      </div>
    </div>
  );
}
