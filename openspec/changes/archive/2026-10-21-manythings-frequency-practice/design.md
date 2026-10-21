# Design

## Context

See `proposal.md` for background and motivation.
Currently, `rip-it-out` manages speaking improvements extracted from media sessions and translates them into SRS flashcards. The application is a client-side React 19 app with zero backend (persisted locally and synced with Supabase when configured). Manythings.org hosts thousands of Tatoeba English-Russian sentence equivalents structured as numbered JavaScript files (`1.js`, `2.js`, etc.) setting a global `var sent = [...]` array of tab-separated values.

## Goals / Non-Goals

**Goals:**
- Dynamically stream and parse sentence pages directly from `https://www.manythings.org/bilingual/rus/{page}.js` using a browser-friendly mechanism that avoids CORS restrictions.
- Provide clean 1-to-1 English-Russian sentence deduplication.
- Provide a full-screen, responsive flashcard practice session with direction toggling and speech playback.
- Implement first-encounter triage: skip `Easy` sentences entirely, store `Good`/`Hard`/`Again` sentences into the app's SRS store.
- Implement an interactive AI mini-drill loop for `Hard`/`Again` sentences supporting both text and speech transcription.
- Persist page and sentence progress in localStorage.

**Non-Goals:**
- Downloading or bundling the entire Tatoeba/Manythings archive (~400k lines) into static build assets.
- Modifying existing session review or translation story workflows.
- Offline support when network connectivity is lost (graceful retry states will be provided).

## Decisions

### 1. In-Browser Dynamic Script Tag Streaming
- **Decision**: Load each `page.js` dynamically via DOM script injection (`document.createElement('script')`), capturing `window.sent`, then cleaning up the injected tag.
- **Rationale**: Browsers permit script-tag loads across origins without CORS preflight or backend proxy servers. This enables pure static GitHub Pages deployment with zero server setup.
- **Alternatives Considered**:
  - *Vite proxy / CORS proxy*: Works during local development or requires third-party public CORS proxies that may be slow, rate-limited, or insecure.
  - *Offline bundled archive*: Inflates bundle size significantly and limits dynamic page-by-page exploration.

### 2. Sentence Parsing & 1-to-1 Deduplication
- **Decision**: Parse tab-separated strings (`[ruId, enId, ruText, ruAuthor, enText, enAuthor]`) into structured objects. Deduplicate by English and Russian text so each phrase has a single clean canonical counterpart per page.
- **Rationale**: Manythings pages often contain several slight inflectional variants of the same sentence (e.g. "Wait!" -> "Стой!", "Подожди!", "Подождите!"). Deduplication prevents repetitive cards within the same page.
- **Alternatives Considered**: Keeping all variations as individual cards (causes learner fatigue on simple repeated phrases).

### 3. Integrated SRS Storage via Existing Store
- **Decision**: When a sentence is rated `Good`, `Hard`, or `Again`, create an improvement record linked to a system session `"Manythings Frequency Sentences"` via `addImprovements` and `createSrsCard`.
  - For `Good`: Set status to review with 1-day interval.
  - For `Hard` / `Again`: Set status to `learning` with interval 1 day, ease factor adjusted.
  - For `Easy`: Do not persist to database or localStorage SRS queue.
- **Rationale**: Integrates smoothly with the existing `Review.jsx` flashcard system, stats, and dashboard queries without requiring separate database tables.

### 4. Interactive Mini-Drills via Existing AI Infrastructure
- **Decision**: Reuse `requestOpenAIChat` / `aiService` with a new prompt template `generateFrequencyDrillPrompt` and `evaluateFrequencyDrillPrompt`. Support user voice input using existing Groq/OpenAI Whisper transcription (`transcribeAudio`).
- **Rationale**: Consistent with existing interactive translation sessions; gives real-time conversational feedback with zero new external SDKs.

### 5. Audio Pronunciation via Web Speech API with Fallback
- **Decision**: Use Web Speech API (`SpeechSynthesisUtterance`) with language-specific voices (`ru-RU` and `en-US`), with fallback to existing `AudioPlayerButton` TTS.
- **Rationale**: Fast, native, cost-free pronunciation for both Russian and English sentences.

## Risks / Trade-offs

- **[Risk]** `manythings.org` script layout or URL scheme changes.
  → **Mitigation**: Encapsulate URL construction and payload parsing in a dedicated service `manythingsService.js` with comprehensive unit tests and error handling with friendly user prompts.
- **[Risk]** Missing OpenAI/Groq API keys for AI mini-drills.
  → **Mitigation**: When API keys are not configured, display a clear prompt in the drill interface pointing the user to Settings, while still allowing manual flip/self-rating and progression to the next sentence.
- **[Risk]** Rapid clicking causes memory leaks or race conditions during script tag injection.
  → **Mitigation**: Manage script load lifecycles with cleanup on unmount or cancellation, maintaining an internal in-flight promise cache.
