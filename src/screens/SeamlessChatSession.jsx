import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addImprovements, updateSession, logActivity, addSessionText } from '../store';
import { streamSeamlessChatCompletion, evaluateSingleMessage } from '../services/aiService';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayerButton from '../components/AudioPlayerButton';
import { buildAnnotatedText } from '../textAnnotator';

export default function SeamlessChatSession({ session: initialSession, settings }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(initialSession);
  const [messages, setMessages] = useState(initialSession?.messages || []);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluatingMap, setEvaluatingMap] = useState({});
  const [addedImprovementsMap, setAddedImprovementsMap] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [startTime] = useState(Date.now());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome prompt if message list is empty
  useEffect(() => {
    if (messages.length === 0 && session) {
      const initialGreeting = {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hi there! Tell me about the ${session.sourceType} "${session.title}" that you went through. What were your main takeaways or thoughts?`,
        createdAt: new Date().toISOString(),
      };
      const newMsgs = [initialGreeting];
      setMessages(newMsgs);
      updateSession(session.id, { messages: newMsgs });
    }
  }, [session]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setErrorMsg('');
    setInputText('');

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      isImproved: false,
      improvements: [],
      createdAt: new Date().toISOString(),
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    await updateSession(session.id, { messages: updatedMsgs });

    setLoading(true);

    try {
      // Create placeholder assistant message
      const assistantMsgId = `asst_${Date.now()}`;
      let accumulatedReply = '';

      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      const msgsWithAsst = [...updatedMsgs, assistantMsg];
      setMessages(msgsWithAsst);

      await streamSeamlessChatCompletion(session, updatedMsgs, settings, (chunk) => {
        accumulatedReply = chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m))
        );
      });

      const finalMsgs = msgsWithAsst.map((m) =>
        m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m
      );
      setMessages(finalMsgs);
      await updateSession(session.id, { messages: finalMsgs });
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateMessage = async (msgId, userText) => {
    setEvaluatingMap((prev) => ({ ...prev, [msgId]: true }));
    setErrorMsg('');

    try {
      const res = await evaluateSingleMessage(userText, settings);
      const updated = messages.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            isImproved: true,
            improvements: res.improvements || [],
          };
        }
        return m;
      });

      setMessages(updated);
      await updateSession(session.id, { messages: updated });
    } catch (err) {
      console.error('Evaluation error:', err);
      setErrorMsg(err.message || 'Failed to evaluate message improvements.');
    } finally {
      setEvaluatingMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleAddToStudyList = async (imp, msgContext) => {
    try {
      const itemWithContext = {
        ...imp,
        context: imp.context || msgContext || '',
      };
      await addImprovements(session.id, [itemWithContext]);
      setAddedImprovementsMap((prev) => ({ ...prev, [imp.original]: true }));
    } catch (err) {
      console.error('Error adding to study list:', err);
    }
  };

  const handleFinishSession = async () => {
    try {
      setLoading(true);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Concatenate user text for rawText metric compatibility
      const userFullText = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n');

      if (userFullText) {
        await addSessionText(session.id, userFullText);
      }

      if (durationSeconds > 0) {
        await logActivity({
          type: 'session',
          durationSeconds,
          sessionId: session.id,
          topicId: session.topicId,
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Error finishing session:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[82vh] glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in">
      {/* Session Header */}
      <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>✨ Seamless AI Coach</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
              {session?.sourceType}
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-medium truncate max-w-xs sm:max-w-md">
            "{session?.title}"
          </p>
        </div>

        <button
          onClick={handleFinishSession}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
        >
          Finish Session ✓
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0e15]/50">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            return (
              <div key={m.id} className="flex gap-3 items-start max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  🤖
                </div>
                <div className="glass-panel p-3.5 rounded-2xl rounded-tl-sm text-sm text-gray-200 leading-relaxed space-y-2 border border-purple-500/20">
                  <p className="whitespace-pre-wrap">{m.content || 'Thinking...'}</p>
                </div>
              </div>
            );
          }

          // User turn
          const isEvaluating = evaluatingMap[m.id];
          const hasImprovements = m.isImproved && Array.isArray(m.improvements) && m.improvements.length > 0;

          return (
            <div key={m.id} className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
              <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                {!m.isImproved ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <UserAnnotatedMessage
                    userText={m.content}
                    improvements={m.improvements}
                    addedMap={addedImprovementsMap}
                    onAddToStudyList={(imp) => handleAddToStudyList(imp, m.content)}
                    settings={settings}
                  />
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 px-1">
                {!m.isImproved && (
                  <button
                    onClick={() => handleEvaluateMessage(m.id, m.content)}
                    disabled={isEvaluating}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Evaluating...
                      </span>
                    ) : (
                      <span>✨ Improve Message</span>
                    )}
                  </button>
                )}
                {m.isImproved && (
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                    ✓ {m.improvements?.length || 0} Improvements Found
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
        <AudioRecorder
          settings={settings}
          onTranscribed={(transcription) => {
            setInputText((prev) => (prev ? `${prev} ${transcription}` : transcription));
          }}
          onError={(err) => setErrorMsg(err)}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak above or type your answer in English..."
            disabled={loading}
            className="flex-1 bg-[#0e0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0"
          >
            Send ▶
          </button>
        </form>
      </div>
    </div>
  );
}

function UserAnnotatedMessage({ userText, improvements = [], addedMap = {}, onAddToStudyList, settings }) {
  const { segments } = buildAnnotatedText(userText, improvements);
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-sm">
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={idx}>{seg.content}</span>;
        }

        const isAdded = addedMap[seg.original];
        const isOpen = activeIdx === idx;

        return (
          <span
            key={idx}
            className="relative inline-block my-0.5 mx-1 cursor-pointer group"
            onClick={() => setActiveIdx(isOpen ? null : idx)}
          >
            <span className="line-through text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40 mr-1">
              {seg.original}
            </span>
            <span className="text-emerald-300 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/60">
              {seg.improved}
            </span>

            {/* Hover Tooltip Popover */}
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 bg-[#12131f] text-xs text-gray-200 rounded-xl border border-purple-500/50 shadow-2xl z-20 space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                  {seg.category || 'grammar'}
                </span>
                <AudioPlayerButton text={seg.improved} settings={settings} size="sm" />
              </div>

              {seg.construction && (
                <div className="font-bold text-purple-300">
                  Pattern: "{seg.construction}"
                </div>
              )}

              <div className="space-y-1 bg-[#0a0b12] p-2 rounded border border-gray-800">
                <p className="text-rose-400 line-through">🔴 Original: "{seg.original}"</p>
                <p className="text-emerald-400 font-semibold">🟢 Improved: "{seg.improved}"</p>
              </div>

              <p className="text-gray-300">{seg.explanation}</p>

              {seg.context && (
                <div className="text-[11px] text-gray-400 bg-gray-900/60 p-1.5 rounded border border-gray-800 italic">
                  Context: "{seg.context}"
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToStudyList(seg);
                }}
                disabled={isAdded}
                className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                  isAdded
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                }`}
              >
                {isAdded ? '✓ Added to Study List' : '➕ Add to Study List'}
              </button>
            </div>
          </span>
        );
      })}
    </div>
  );
}
