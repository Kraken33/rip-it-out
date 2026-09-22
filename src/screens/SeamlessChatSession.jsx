import React, { useState, useEffect, useRef } from 'react';
import { updateSession, logActivity, addSessionText } from '../store';
import { streamSeamlessChatCompletion } from '../services/aiService';
import AudioRecorder from '../components/AudioRecorder';

export default function SeamlessChatSession({ session: initialSession, settings, onFinish }) {
  const [session] = useState(initialSession);
  const [messages, setMessages] = useState(initialSession?.messages || []);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [startTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow the message textarea up to its max height (max-h-40)
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [inputText]);

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

  const handleFinishSession = async () => {
    try {
      setLoading(true);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Concatenate user text for feedback analysis & rawText metric compatibility
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

      if (onFinish) {
        onFinish(userFullText);
      }
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
          id="btn-finish-seamless-session"
          onClick={handleFinishSession}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
        >
          Finish Conversation →
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
          return (
            <div key={m.id} className="flex flex-col items-end gap-1.5 ml-auto max-w-[90%]">
              <div className="glass-panel p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed border border-purple-500/30 bg-purple-950/20 text-white w-full">
                <p className="whitespace-pre-wrap">{m.content}</p>
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
          className="space-y-2"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Speak above or type your answer in English..."
              rows={1}
              disabled={loading}
              className="flex-1 max-h-40 bg-[#0e0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium resize-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0"
            >
              Send ▶
            </button>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">
            Enter for new line · Ctrl/Cmd+Enter to send
          </p>
        </form>
      </div>
    </div>
  );
}
