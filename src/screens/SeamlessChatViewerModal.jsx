import React from 'react';
import { countTextWords } from '../store';
import { buildAnnotatedText } from '../textAnnotator';

export default function SeamlessChatViewerModal({ session, onClose }) {
  if (!session) return null;

  const messages = session.messages || [];

  const userTextFull = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n');

  const metrics = countTextWords(userTextFull);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/30 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27283d] bg-[#151622]">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold text-white truncate max-w-md">
              Seamless Chat: {session.title}
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

        {/* Content Thread */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#0d0e15]/60 text-sm leading-relaxed">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 italic py-8">No saved chat transcript available for this session.</p>
          ) : (
            messages.map((m) => {
              if (m.role === 'assistant') {
                return (
                  <div key={m.id} className="flex gap-3 items-start max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                      🤖
                    </div>
                    <div className="glass-panel p-3.5 rounded-2xl rounded-tl-sm text-sm text-gray-200 border border-purple-500/20">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              }

              // User Turn
              const improvements = m.improvements || [];
              const hasImprovements = m.isImproved && improvements.length > 0;
              const { segments } = buildAnnotatedText(m.content, improvements);

              return (
                <div key={m.id} className="flex flex-col items-end gap-1 ml-auto max-w-[90%]">
                  <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                    {!hasImprovements ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {segments.map((seg, idx) => {
                          if (seg.type === 'text') return <span key={idx}>{seg.content}</span>;
                          return (
                            <span key={idx} className="relative inline-block my-0.5 mx-1 cursor-pointer group">
                              <span className="line-through text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40 mr-1">
                                {seg.original}
                              </span>
                              <span className="text-emerald-300 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/60">
                                {seg.improved}
                              </span>

                              {/* Tooltip */}
                              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#12131f] text-xs text-gray-200 rounded-xl border border-purple-500/50 shadow-xl z-20 space-y-1.5 pointer-events-none">
                                {seg.construction && (
                                  <div className="font-bold text-purple-300">
                                    Pattern: "{seg.construction}"
                                  </div>
                                )}
                                <div>{seg.explanation}</div>
                                {seg.context && (
                                  <div className="text-[10px] text-gray-400 italic bg-gray-900/60 p-1 rounded border border-gray-800">
                                    Context: "{seg.context}"
                                  </div>
                                )}
                              </div>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Metrics Footer */}
        <div className="px-6 py-4 border-t border-[#27283d] bg-[#151622] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>📝 <strong className="text-white">{metrics.totalWords}</strong> spoken words</span>
            <span>·</span>
            <span>🔤 <strong className="text-white">{metrics.uniqueWords}</strong> unique</span>
            <span>·</span>
            <span>📊 <strong className="text-white">{(metrics.vocabularyDensity * 100).toFixed(1)}%</strong> density</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-semibold">
            {messages.filter((m) => m.role === 'user').length} User Turns
          </span>
        </div>
      </div>
    </div>
  );
}
