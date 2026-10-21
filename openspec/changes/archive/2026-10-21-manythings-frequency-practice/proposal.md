# Proposal

## Why

Learners need structured, frequency-ranked bilingual sentence practice to internalize high-frequency sentence patterns without manually authoring flashcard decks. By dynamically streaming curated English-Russian sentence pairs directly from Manythings (Tatoeba) page-by-page, learners can rapidly triage sentences: immediately discard phrases they already know ("Easy"), queue unfamiliar ones into spaced repetition ("Good"), and engage in targeted AI mini-drills for phrases they struggle with ("Hard" / "Again").

## What Changes

- Add dynamic page-by-page in-browser loader (`manythingsService.js`) to stream and parse sentence pairs from `manythings.org/bilingual/rus/{page}.js` without CORS barriers, deduplicating pairs 1-to-1.
- Introduce a dedicated full-screen practice session screen (`FrequencyPracticeSession.jsx`) accessible at `/frequency-practice`.
- Add prominent entry cards on both Dashboard and Practice screens to launch frequency sentence practice.
- Support bidirectional flashcard display (Russian $\leftrightarrow$ English) with Web Speech API / TTS audio playback buttons.
- Implement first-encounter triage logic:
  - **Easy**: Skip completely (never added to SRS).
  - **Good**: Automatically persist to SRS library and advance.
  - **Hard / Again**: Persist to SRS in learning state and immediately trigger an interactive mini-drill loop.
- Implement AI-powered interactive mini-drills: generate similar drill sentences one at a time, accept spoken (Whisper STT) or typed input, evaluate naturalness/accuracy with live feedback, and allow repeating drills or proceeding.
- Persist page progress and sentence index in local storage so learners seamlessly resume their position across sessions.

## Capabilities

### New Capabilities
- `frequency-sentence-practice`: Covers dynamic streaming from Manythings, flashcard review with TTS, first-encounter SRS triage, and real-time interactive AI mini-drills for tricky sentence structures.

### Modified Capabilities
<!-- None: existing review, translation-story, and session-flow requirements remain untouched. -->

## Impact

- **UI / Screens**: New screen `FrequencyPracticeSession.jsx`, added route in `App.jsx`, new launcher card in `Dashboard.jsx` and `Practice.jsx`.
- **Services / Utilities**: New `manythingsService.js` for dynamic script-tag streaming and TSV parsing; mini-drill generation & evaluation prompts in `prompts.js` and calls in `aiService.js`.
- **Data Persistence**: Uses `store.js` (`addImprovements` / `createSrsCard` / activity logging) and a new local storage key for frequency practice pagination state.
- **Dependencies**: No external npm packages required (uses existing React 19, Tailwind CSS, Vite, and existing Groq/OpenAI integrations).
