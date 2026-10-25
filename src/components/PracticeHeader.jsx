import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared practice mode header with segmented pill tabs and contextual right-side action slot.
 */
export default function PracticeHeader({ activeMode = 'translation', rightContent = null }) {
  const navigate = useNavigate();

  return (
    <div
      data-testid="practice-header"
      className="flex flex-wrap items-center justify-between gap-3 bg-[#11121c] p-2 rounded-xl border border-gray-800"
    >
      <div className="flex items-center gap-2">
        {activeMode === 'translation' ? (
          <span
            data-testid="tab-translation-active"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white shadow flex items-center gap-1.5 cursor-default"
          >
            🌐 Translation Practice
          </span>
        ) : (
          <button
            type="button"
            data-testid="tab-translation-inactive"
            onClick={() => navigate('/practice')}
            className="px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5"
          >
            🌐 Translation Practice
          </button>
        )}

        {activeMode === 'frequency' ? (
          <span
            data-testid="tab-frequency-active"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white shadow flex items-center gap-1.5 cursor-default"
          >
            ⚡ Frequency Sentences
          </span>
        ) : (
          <button
            type="button"
            data-testid="tab-frequency-inactive"
            onClick={() => navigate('/frequency-practice')}
            className="px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5"
          >
            ⚡ Frequency Sentences
          </button>
        )}
      </div>

      {rightContent && (
        <div data-testid="practice-header-right" className="flex items-center gap-2 flex-wrap">
          {rightContent}
        </div>
      )}
    </div>
  );
}
