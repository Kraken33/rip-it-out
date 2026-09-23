import React from 'react';
import { countTextWords } from '../store';

// Read-only replay of a finished story-translation session. Word metrics are
// computed from learner translations only — story passages, improved versions,
// and feedback never contribute to the counts.
export default function TranslationStoryViewerModal({ session, onClose }) {
  if (!session) return null;

  const messages = session.messages || [];
  const rounds = messages.filter((m) => m.role === 'story-round');

  const learnerText =
    rounds.length > 0
      ? rounds.map((r) => r.translation || '').join('\n\n')
      : session.rawText || '';
  const metrics = countTextWords(learnerText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/30 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27283d] bg-[#151622]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="text-lg font-bold text-white truncate max-w-md">
              Story Translation: {session.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-gray-800 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Round thread */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#0d0e15]/60 text-sm leading-relaxed">
          {rounds.length === 0 ? (
            <p className="text-center text-gray-400 italic py-8">
              No saved story rounds available for this session.
            </p>
          ) : (
            rounds.map((round, idx) => (
              <div key={idx} className="space-y-3" data-testid={`story-round-${idx}`}>
                {/* Story passage */}
                <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1">
                    Round {round.round ?? idx + 1} · Story passage
                  </span>
                  <div className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-purple-500/20 text-white w-full">
                    <p className="whitespace-pre-wrap">📖 {round.passage}</p>
                  </div>
                </div>

                {/* Learner translation */}
                <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1">
                    Your translation
                  </span>
                  <div className="glass-panel p-4 rounded-2xl rounded-tr-sm border border-purple-500/30 bg-purple-950/20 text-white w-full">
                    <p className="whitespace-pre-wrap">{round.translation}</p>
                  </div>
                </div>

                {/* Improved version */}
                {round.improvedVersion && (
                  <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold px-1">
                      Natural version
                    </span>
                    <div className="glass-panel p-4 rounded-2xl rounded-tl-sm border border-emerald-600/30 bg-emerald-950/20 text-emerald-100 w-full">
                      <p className="whitespace-pre-wrap">{round.improvedVersion}</p>
                    </div>
                  </div>
                )}

                {/* Candidate constructions */}
                {Array.isArray(round.constructions) && round.constructions.length > 0 && (
                  <div className="glass-panel p-3.5 rounded-xl border border-purple-500/20 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">
                      Constructions from this round
                    </p>
                    <ul className="space-y-1">
                      {round.constructions.map((c, ci) => (
                        <li key={ci} className="text-xs text-gray-200">
                          <span className="font-bold text-purple-300">{c.construction}</span>
                          {c.improved && (
                            <span className="text-gray-400"> — {c.improved}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Metrics footer — learner translations only */}
        <div className="px-6 py-4 border-t border-[#27283d] bg-[#151622] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>📝 <strong className="text-white">{metrics.totalWords}</strong> translated words</span>
            <span>·</span>
            <span>🔤 <strong className="text-white">{metrics.uniqueWords}</strong> unique</span>
            <span>·</span>
            <span>📊 <strong className="text-white">{(metrics.vocabularyDensity * 100).toFixed(1)}%</strong> density</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-semibold">
            {rounds.length} Story {rounds.length === 1 ? 'Round' : 'Rounds'}
          </span>
        </div>
      </div>
    </div>
  );
}
