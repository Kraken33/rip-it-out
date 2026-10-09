import React, { useState, useEffect, useRef, useCallback } from 'react';
import { updateSession, logActivity, addSessionText } from '../store';
import { streamSeamlessChatCompletion } from '../services/aiService';
import ConstructionExtractor from '../components/ConstructionExtractor';
import InteractiveSessionShell from '../components/InteractiveSessionShell';
import { scrollToElementBottom } from '../hooks/useVisualViewport';

export default function SeamlessChatSession({ session: initialSession, settings, onFinish }) {
  const [session] = useState(initialSession);
  const [messages, setMessages] = useState(initialSession?.messages || []);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [startTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToLatest = useCallback(() => {
    scrollToElementBottom(messagesEndRef.current);
  }, []);

  useEffect(() => {
    scrollToLatest();
  }, [messages, scrollToLatest]);

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

  const headerLeftContent = (
    <div>
      <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
        <span>✨ Seamless AI Coach</span>
        {session?.sourceType && (
          <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
            {session.sourceType}
          </span>
        )}
      </h1>
      <p className="text-xs text-gray-400 font-medium truncate max-w-xs sm:max-w-md">
        "{session?.title}"
      </p>
    </div>
  );

  const headerRightContent = (
    <button
      id="btn-finish-seamless-session"
      type="button"
      onClick={handleFinishSession}
      disabled={loading}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
    >
      Finish Conversation →
    </button>
  );

  return (
    <InteractiveSessionShell
      messagesEndRef={messagesEndRef}
      onKeyboardOpen={scrollToLatest}
      headerLeft={headerLeftContent}
      headerRight={headerRightContent}
      mobileHeaderContent={headerLeftContent}
      mobileRoundLabel="Chat"
      renderMobileActions={({ closeMenu }) => (
        <button
          id="btn-finish-seamless-session-mobile"
          type="button"
          onClick={() => {
            closeMenu();
            handleFinishSession();
          }}
          disabled={loading}
          className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>✓</span>
          <span>Finish Conversation →</span>
        </button>
      )}
      inputRef={inputRef}
      inputText={inputText}
      onInputChange={setInputText}
      onInputFocus={scrollToLatest}
      onSubmit={() => handleSendMessage()}
      canSubmit={Boolean(inputText.trim()) && !loading}
      submitLabel="Send ▶"
      submitButtonId="btn-send-seamless-message"
      inputPlaceholder="Speak above or type your answer in English..."
      shortcutHint="Enter for new line · Ctrl/Cmd+Enter to send"
      inputDisabled={loading}
      errorMsg={errorMsg}
      settings={settings}
      onAudioError={(err) => setErrorMsg(err)}
    >
      {messages.map((m) => {
        if (m.role === 'assistant') {
          return (
            <div key={m.id} className="flex gap-3 items-start max-w-[85%] w-full">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                🤖
              </div>
              <ConstructionExtractor
                sessionId={session?.id}
                settings={settings}
                sourceText={m.content}
                disabled={loading}
                className="flex-1"
              >
                <div className="glass-panel p-3.5 rounded-2xl rounded-tl-sm text-sm text-gray-200 leading-relaxed space-y-2 border border-purple-500/20">
                  <p className="whitespace-pre-wrap">{m.content || 'Thinking...'}</p>
                </div>
              </ConstructionExtractor>
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
    </InteractiveSessionShell>
  );
}
