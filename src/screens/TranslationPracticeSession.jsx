import React, { useState, useEffect, useRef } from 'react';
import { streamTranslationPracticeCompletion } from '../services/aiService';
import { parseTaggedPassage } from '../textAnnotator';
import AudioRecorder from '../components/AudioRecorder';

export default function TranslationPracticeSession({ allCards = [], settings = {}, onFinish }) {
  // Batch cards into 4-5 rounds of 3-5 items each
  const itemsPerRound = 4;
  const roundsCount = Math.max(1, Math.ceil(allCards.length / itemsPerRound));

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  const currentRoundCards = allCards.slice(
    currentRoundIndex * itemsPerRound,
    (currentRoundIndex + 1) * itemsPerRound
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Trigger initial passage generation when round changes or starts
  useEffect(() => {
    let isMounted = true;

    async function loadRoundPassage() {
      if (!currentRoundCards || currentRoundCards.length === 0) return;
      setLoading(true);
      setErrorMsg('');

      const assistantMsgId = `asst_round_${currentRoundIndex}_${Date.now()}`;
      const initialPromptMsg = {
        role: 'user',
        content: `Start Round ${currentRoundIndex + 1} of ${roundsCount}. Please write a short natural Russian passage with tagged target constructions for this round.`,
      };

      const tempMsgs = [...messages, initialPromptMsg];
      let accumulatedReply = '';

      const placeholderMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages([...messages, placeholderMsg]);

      try {
        await streamTranslationPracticeCompletion(
          currentRoundCards,
          tempMsgs,
          settings,
          (chunk) => {
            if (!isMounted) return;
            accumulatedReply = chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m))
            );
          }
        );
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load round passage from AI.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRoundPassage();

    return () => {
      isMounted = false;
    };
  }, [currentRoundIndex]);

  const handleSendTranslation = async () => {
    const text = inputText.trim();
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

    setLoading(true);

    try {
      const assistantMsgId = `asst_fb_${Date.now()}`;
      let accumulatedReply = '';

      const placeholderMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages([...updatedMsgs, placeholderMsg]);

      await streamTranslationPracticeCompletion(
        currentRoundCards,
        updatedMsgs,
        settings,
        (chunk) => {
          accumulatedReply = chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedReply } : m))
          );
        }
      );
    } catch (err) {
      console.error('Translation error:', err);
      setErrorMsg(err.message || 'Failed to send translation.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex + 1 < roundsCount) {
      setCurrentRoundIndex((prev) => prev + 1);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = () => {
    // Collect all cards encountered up to current round
    const cardsEncountered = allCards.slice(
      0,
      Math.min(allCards.length, (currentRoundIndex + 1) * itemsPerRound)
    );
    if (onFinish) {
      onFinish(cardsEncountered);
    }
  };

  const renderTaggedMessage = (content) => {
    const segments = parseTaggedPassage(content);
    return (
      <span>
        {segments.map((seg, idx) => {
          if (seg.isHighlight) {
            return (
              <span
                key={idx}
                title={seg.target ? `Target: ${seg.target}` : 'Target construction'}
                className="inline-block my-0.5 mx-1 px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/50 text-purple-200 font-semibold cursor-help transition-all hover:bg-purple-800/80"
              >
                {seg.text}
                {seg.target && (
                  <span className="ml-1 text-[10px] text-purple-400 font-normal">
                    ({seg.target})
                  </span>
                )}
              </span>
            );
          }
          return <span key={idx}>{seg.text}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col h-[82vh] glass-panel rounded-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in">
      {/* Session Header */}
      <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>🌐 Russian Translation Practice</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50">
              Round {currentRoundIndex + 1} of {roundsCount}
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Read Russian text with highlighted constructions and translate it into English!
          </p>
        </div>

        <button
          id="btn-finish-translation-practice"
          onClick={handleFinishSession}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
        >
          Finish & Rate Recall →
        </button>
      </div>

      {/* Target Constructions Chip Bar */}
      <div className="px-5 py-2.5 bg-[#0a0b12] border-b border-gray-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-bold shrink-0">Round Targets:</span>
        {currentRoundCards.map((c, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50 font-medium shrink-0"
          >
            🎯 {c.construction || c.improved}
          </span>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0e15]/50">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            return (
              <div key={m.id} className="flex gap-3 items-start max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  🤖
                </div>
                <div className="glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200 leading-relaxed space-y-2 border border-purple-500/20 w-full">
                  <p className="whitespace-pre-wrap">
                    {m.content ? renderTaggedMessage(m.content) : 'Generating passage...'}
                  </p>
                </div>
              </div>
            );
          }

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

      {/* Navigation & Controls Footer */}
      <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
        <div className="flex justify-between items-center">
          <AudioRecorder
            settings={settings}
            onTranscribed={(transcription) => {
              setInputText((prev) => (prev ? `${prev} ${transcription}` : transcription));
            }}
            onError={(err) => setErrorMsg(err)}
          />

          {currentRoundIndex + 1 < roundsCount ? (
            <button
              onClick={handleNextRound}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/40 transition cursor-pointer disabled:opacity-50"
            >
              Next Round ({currentRoundIndex + 2}/{roundsCount}) →
            </button>
          ) : (
            <button
              onClick={handleFinishSession}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Finish Practice ✓
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTranslation();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or speak your English translation..."
            disabled={loading}
            className="flex-1 bg-[#0e0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer disabled:opacity-50 shrink-0"
          >
            Translate ▶
          </button>
        </form>
      </div>
    </div>
  );
}
