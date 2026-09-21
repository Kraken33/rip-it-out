import { useState, useEffect } from 'react';
import { playText, stopAudio, isPlayingText } from '../services/audioPlayer';

export default function AudioPlayerButton({ text, settings, className = '', size = 'md' }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (playing) {
        stopAudio();
      }
    };
  }, [playing]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (playing) {
      stopAudio();
      setPlaying(false);
      return;
    }

    playText(text, settings, ({ playing: isPlaying, loading: isLoading }) => {
      setPlaying(Boolean(isPlaying));
      setLoading(Boolean(isLoading));
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={playing ? 'Stop audio' : 'Listen to native pronunciation'}
      aria-label={playing ? 'Stop audio' : 'Listen to audio'}
      className={`inline-flex items-center justify-center rounded-full transition-all cursor-pointer ${
        playing
          ? 'bg-[var(--accent)] text-white animate-pulse shadow-[0_0_12px_hsla(262,83%,65%,0.5)]'
          : loading
          ? 'bg-[var(--bg-elevated)] text-[var(--accent)] border border-[var(--accent)]'
          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)]'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : playing ? (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </span>
      ) : (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      )}
    </button>
  );
}
