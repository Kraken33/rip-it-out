import React, { useState } from 'react';
import { buildAnnotatedText } from '../textAnnotator';
import { countTextWords } from '../store';

export default function ConversationViewerModal({ session, improvements = [], onClose }) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);

  if (!session || !session.rawText) return null;

  const { segments, matchedCount, unmatchedCount } = buildAnnotatedText(session.rawText, improvements);
  const metrics = countTextWords(session.rawText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-highlight)] shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h2 className="text-lg font-bold text-[var(--text-main)] truncate max-w-md">
              Conversation: {session.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-[var(--bg-card-hover)] transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-wrap">
          <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
            {segments.map((seg, idx) => {
              if (seg.type === 'text') {
                return <span key={idx}>{seg.content}</span>;
              }

              const isTooltipOpen = activeTooltipIndex === idx;

              return (
                <span
                  key={idx}
                  className="relative inline-block my-0.5 mx-1 cursor-pointer group"
                  onClick={() => setActiveTooltipIndex(isTooltipOpen ? null : idx)}
                >
                  <span className="line-through text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-800/40 mr-1">
                    {seg.original}
                  </span>
                  <span className="text-emerald-300 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/50">
                    {seg.improved}
                  </span>

                  {/* Tooltip / Explanation popover */}
                  {(isTooltipOpen || true) && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-xs text-gray-200 rounded-xl border border-purple-500/40 shadow-xl z-10 pointer-events-none">
                      {seg.construction && (
                        <div className="font-semibold text-purple-300 mb-1">
                          Pattern: {seg.construction}
                        </div>
                      )}
                      <div>{seg.explanation}</div>
                    </div>
                  )}
                </span>
              );
            })}
          </div>

          <div className="text-xs text-[var(--text-dim)] text-center italic">
            💡 Hover or tap highlighted corrections to inspect patterns and explanations.
          </div>
        </div>

        {/* Footer Metrics Summary */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <span>📝 <strong className="text-[var(--text-main)]">{metrics.totalWords}</strong> words</span>
            <span>·</span>
            <span>🔤 <strong className="text-[var(--text-main)]">{metrics.uniqueWords}</strong> unique</span>
            <span>·</span>
            <span>📊 <strong className="text-[var(--text-main)]">{(metrics.vocabularyDensity * 100).toFixed(1)}%</strong> density</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              {matchedCount} inline fixes
            </span>
            {unmatchedCount > 0 && (
              <span className="px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                {unmatchedCount} unmatched
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
