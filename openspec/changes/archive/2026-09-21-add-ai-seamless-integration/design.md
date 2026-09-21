# Design Document: Seamless AI Integration & Audio Playback

## Overview
This design specifies the client-side architecture for integrating Groq API and OpenAI API into **rip-it-out**, enabling seamless voice recording, AI coaching completions, and text-to-speech audio playback.

---

## Component & Service Architecture

```
+--------------------------------------------------------------------------------+
|                             SYSTEM ARCHITECTURE                                |
+--------------------------------------------------------------------------------+
|                                                                                |
|  [ Settings.jsx ] ---- (API Keys) ----> [ store.js (LocalStorage/Supabase) ]   |
|                                                     |                          |
|                                                     v                          |
|  [ Session.jsx / Practice.jsx ] ------------> [ aiService.js ]                 |
|          |                                          |                          |
|          |-- (Speech Record) --> [AudioRecorder] ---+ (Whisper / Llama API)    |
|          |                                          |                          |
|          +-- (Audio Play) -----> [audioPlayer.js] --+ (SpeechSynth / OpenAI)   |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### 1. Settings Data Model (`store.js`)
Extend `DEFAULT_SETTINGS` with:
```js
const DEFAULT_SETTINGS = {
  formality: 'casual',
  level: 'intermediate',
  focusArea: 'all',
  maxImprovements: 5,
  practiceMode: 'flashcard',

  // New Integration Settings:
  groqApiKey: '',
  openaiApiKey: '',
  ttsEngine: 'browser', // 'browser' | 'openai'
  ttsVoice: 'alloy',    // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  defaultMode: 'seamless', // 'seamless' | 'prompt'
};
```

### 2. AI Service Layer (`src/services/aiService.js`)
Unified API helper for client-side API calls:
- `transcribeAudio(audioBlob, apiKey)`: Calls Groq Whisper API `https://api.groq.com/openai/v1/audio/transcriptions`.
- `generateSeamlessSessionFeedback(session, settings, userText)`: Calls Groq `llama-3.3-70b-versatile` endpoint with system prompts formatted for JSON output (`response_format: { type: "json_object" }`).
- `fetchOpenAITTS(text, voice, apiKey)`: Calls OpenAI `https://api.openai.com/v1/audio/speech`, returns ObjectURL/Audio object.

### 3. Audio Player Service (`src/services/audioPlayer.js`)
- `playText(text, settings)`:
  - If `settings.ttsEngine === 'openai'` AND `settings.openaiApiKey` exists:
    Calls `fetchOpenAITTS`, caches the audio ObjectURL, and plays it via `new Audio(url).play()`.
  - Else:
    Uses native `window.speechSynthesis` with `SpeechSynthesisUtterance`.
- `stopAudio()`: Cancels ongoing speech or pauses active HTML5 audio element.

### 4. Component Additions
- `src/components/AudioRecorder.jsx`: Renders mic icon button, manages recording state, uses browser `MediaRecorder` or `webkitSpeechRecognition`.
- `src/components/AudioPlayerButton.jsx`: Small speaker button `🔊` with loading state and playback toggle.
- `src/components/ModeToggle.jsx`: Toggle switch between `✨ Seamless AI` and `📋 Prompt Copy/Paste`.

---

## Data Flow for Seamless Session Step

1. **User presses Record & Speaks**:
   - `AudioRecorder` captures audio blob or live text transcript.
2. **AI Processing**:
   - `Session.jsx` passes text to `aiService.generateSeamlessSessionFeedback()`.
   - Groq LLM returns improvements JSON array directly.
3. **Card & State Update**:
   - `addImprovements()` in `store.js` creates improvements and SRS cards.
4. **Audio Playback**:
   - User taps speaker icon on any improvement to trigger `audioPlayer.playText()`.

---

## Security & Storage
- API keys are stored in client-side storage (`localStorage` / Supabase private settings).
- Direct fetch requests are made from the user's browser directly to Groq (`api.groq.com`) and OpenAI (`api.openai.com`). No backend relay is required.
