import { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '../services/aiService';

export default function AudioRecorder({ settings, onTranscribed, onError, className = '' }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setRecordSeconds(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio track streams
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          await processAudioBlob(audioBlob);
        }
      };

      mediaRecorder.start(100);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      if (onError) {
        onError(err.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not access microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const processAudioBlob = async (audioBlob) => {
    try {
      setTranscribing(true);
      const text = await transcribeAudio(audioBlob, settings);
      if (onTranscribed) {
        onTranscribed(text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      if (onError) onError(err.message || 'Speech transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {transcribing ? (
        <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-xs sm:text-sm font-semibold animate-pulse">
          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="truncate">Transcribing audio with Whisper AI...</span>
        </div>
      ) : recording ? (
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse cursor-pointer shrink-0"
          >
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-white" />
            <span>Stop Recording ({formatTimer(recordSeconds)})</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[var(--accent)] text-white font-bold text-xs sm:text-sm hover:bg-[var(--accent-glow)] transition-all shadow-[0_0_15px_hsla(262,83%,65%,0.3)] cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <span>Speak Answer</span>
        </button>
      )}
    </div>
  );
}
