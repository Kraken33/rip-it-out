# Tasks: Seamless AI Integration & Audio Playback

- [x] 1. Extend Settings & Storage Schema
  - [x] 1.1 Update `DEFAULT_SETTINGS` in `src/store.js` to include `groqApiKey`, `openaiApiKey`, `ttsEngine`, `ttsVoice`, and `defaultMode`.
  - [x] 1.2 Update Settings screen UI in `src/screens/Settings.jsx` with an "AI Integrations & API Keys" section.
  - [x] 1.3 Add inputs for Groq API Key and OpenAI API Key, with test button / connection validation status.
  - [x] 1.4 Add dropdown selector for TTS Engine (`Browser Default` vs `OpenAI Neural TTS`) and OpenAI voice picker (`alloy`, `nova`, `shimmer`, etc.).

- [x] 2. Implement AI Service Layer (`src/services/aiService.js`)
  - [x] 2.1 Implement `transcribeAudio` for Groq Whisper API / Web Speech fallback.
  - [x] 2.2 Implement `generateSeamlessSessionFeedback` for Groq `llama-3.3-70b-versatile` direct JSON extraction.
  - [x] 2.3 Implement `fetchOpenAITTS` for OpenAI audio speech API (`tts-1`).
  - [x] 2.4 Add unit tests for `aiService.js` in `src/__tests__/aiService.test.js`.

- [x] 3. Build Audio Playback Engine & UI Controls
  - [x] 3.1 Create `src/services/audioPlayer.js` with Web Speech API and OpenAI TTS playback logic.
  - [x] 3.2 Create `src/components/AudioPlayerButton.jsx` component for playing sentence audio.
  - [x] 3.3 Create `src/components/AudioRecorder.jsx` component for recording speech input.
  - [x] 3.4 Create `src/components/ModeToggle.jsx` component for switching between Seamless AI and Prompt Copy/Paste modes.

- [x] 4. Integrate Seamless Mode into Session & Review Screens
  - [x] 4.1 Add `ModeToggle` to `src/screens/Session.jsx`.
  - [x] 4.2 Wire voice recording & instant AI analysis in `Session.jsx` when Seamless AI mode is active.
  - [x] 4.3 Add `AudioPlayerButton` to improvement items in `Session.jsx`, `Review.jsx`, and `Practice.jsx`.
  - [x] 4.4 Ensure prompt copy/paste mode remains fully functional and accessible at all times.

- [x] 5. Verification & Testing
  - [x] 5.1 Run unit tests (`npm test`) to verify store and component functionality.
  - [x] 5.2 Test voice recording, transcription, and TTS fallback behaviors in browser environment.
