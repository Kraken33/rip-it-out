import { fetchOpenAITTS } from './aiService';

let activeAudioElement = null;
let activeUtterance = null;
let activeTextBeingPlayed = null;
let activeStateListener = null;

/**
 * Stop any currently playing audio (SpeechSynthesis or HTML5 Audio)
 */
export function stopAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  activeUtterance = null;
  const previousText = activeTextBeingPlayed;
  activeTextBeingPlayed = null;

  if (activeStateListener) {
    activeStateListener({ playing: false, text: previousText });
    activeStateListener = null;
  }
}

/**
 * Check if a specific text is currently playing
 * @param {string} text
 * @returns {boolean}
 */
export function isPlayingText(text) {
  return activeTextBeingPlayed === text;
}

/**
 * Play text aloud using OpenAI TTS (if configured) or Browser SpeechSynthesis fallback
 * @param {string} text - Text to speak
 * @param {Object} settings - User settings
 * @param {Function} [onStateChange] - Callback with { playing: boolean, loading?: boolean, error?: string }
 */
export async function playText(text, settings = {}, onStateChange = () => {}) {
  if (!text || !text.trim()) return;

  // If already playing this text, toggle stop
  if (activeTextBeingPlayed === text) {
    stopAudio();
    return;
  }

  // Stop any other active audio before starting new playback
  stopAudio();

  activeTextBeingPlayed = text;
  activeStateListener = onStateChange;

  const isOpenAI = settings.ttsEngine === 'openai' && settings.openaiApiKey?.trim();

  if (isOpenAI) {
    try {
      onStateChange({ playing: false, loading: true });
      const blob = await fetchOpenAITTS(text, settings.ttsVoice || 'alloy', settings.openaiApiKey);

      if (activeTextBeingPlayed !== text) {
        // Cancelled during fetch
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeAudioElement = audio;

      audio.onplay = () => {
        onStateChange({ playing: true, loading: false });
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudioElement === audio) {
          activeAudioElement = null;
          activeTextBeingPlayed = null;
        }
        onStateChange({ playing: false, loading: false });
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudioElement === audio) activeAudioElement = null;
        activeTextBeingPlayed = null;
        onStateChange({ playing: false, loading: false, error: 'Failed to play audio' });
      };

      await audio.play();
    } catch (err) {
      console.warn('OpenAI TTS failed, falling back to browser speech synthesis:', err.message);
      // Fallback to Web Speech API
      playBrowserSpeech(text, onStateChange);
    }
  } else {
    playBrowserSpeech(text, onStateChange);
  }
}

function playBrowserSpeech(text, onStateChange) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onStateChange({ playing: false, loading: false, error: 'Text-to-speech not supported in this browser' });
    activeTextBeingPlayed = null;
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // slightly natural cadence for language learning

  utterance.onstart = () => {
    onStateChange({ playing: true, loading: false });
  };

  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    activeTextBeingPlayed = null;
    onStateChange({ playing: false, loading: false });
  };

  utterance.onerror = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    activeTextBeingPlayed = null;
    onStateChange({ playing: false, loading: false, error: 'Playback error' });
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
