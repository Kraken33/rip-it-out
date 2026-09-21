# Design

## Context

See `proposal.md` for background motivation. The app currently supports Scenario Practice (Prompt #3) where the LLM asks 5 Russian scenario questions and the user answers in English. This design introduces Translation Practice Mode, where top ~20 SRS cards are split into 4-5 rounds, each presenting a Russian passage with highlighted constructions that the user translates into English.

## Goals / Non-Goals

**Goals:**
- Provide a multi-round (4-5 rounds of 3-5 constructions) Russian-to-English translation practice flow.
- Support dual execution: in-app Seamless AI (direct streaming API) and Prompt-based (Copy/Paste Prompt #5).
- Support visual highlighting of target constructions in Russian text with English target tooltips.
- Seamlessly hand off all practiced cards to the existing manual SRS rating screen (`Rate Recall`).

**Non-Goals:**
- Fully automatic AI-driven SRS card score updates (user requested manual rating).
- Speech synthesis for Russian passages (only English voice input transcription is required).

## Decisions

### 1. Data Structuring & Round Queueing
- **Decision**: Query up to 20 due or upcoming SRS cards using `getDueCards()` / `getSrsCards()`, sorted by due date and ease factor. Group them into chunks of 3-5 items (`rounds = [chunk1, chunk2, chunk3, chunk4]`).
- **Rationale**: 3-5 constructions per round keeps each passage short, readable, and focused for translation.

### 2. Annotation & Highlighting Syntax
- **Decision**: System prompts instruct the LLM to format target Russian phrases as `[[Russian Phrase|Target Construction]]`.
- **Parsing**: A parser function `parseTaggedPassage(text)` converts string passages into structured arrays:
  ```javascript
  [
    { text: "Вчера я ", isTarget: false },
    { text: "пригласил друга в гости", isTarget: true, target: "invite over" },
    { text: ", чтобы поболтать.", isTarget: false }
  ]
  ```
- **Rationale**: Robust and simple regex matching (`/\[\[(.*?)\|(.*?)\]\]/g`) that renders cleanly in React as styled pill components (`<span className="bg-purple-900/60 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/40">...</span>`).

### 3. Dual-Mode Architecture

#### Seamless AI Mode (`TranslationPracticeSession.jsx`)
- Direct streaming using `streamTranslationPracticeCompletion` in `src/services/aiService.js`.
- Manages state: `currentRoundIndex`, `roundCards`, `chatHistory`, `userTranslation`, `aiFeedback`.
- User provides translation via Whisper audio recording (`AudioRecorder.jsx`) or keyboard input.
- AI responds with:
  1. Feedback on English translation accuracy & target construction usage.
  2. The next Russian passage for Round `N + 1`.

#### Prompt-Based Mode (`prompts.js`)
- `generateTranslationPracticePrompt(cards, settings)` generates **Prompt #5**.
- Copyable text containing all 20 cards, instructing ChatGPT/Claude to act as an interactive 4-5 round Russian-to-English translation coach, giving feedback and presenting passage rounds one by one.

### 4. Transition to Rating
- Upon finishing round 4-5 (or clicking "Finish Practice"), `TranslationPracticeSession` invokes `onComplete(practicedCards)`.
- Navigates/switches to the `rating` step in `Practice.jsx`, loading the practiced cards into the existing `RATINGS` selection component for SM-2 updating.

## Risks / Trade-offs

- **[Risk]** LLM fails to include requested target constructions or formats tags incorrectly.
  - *Mitigation*: Regex parsing handles plain text fallback safely. System prompt strongly enforces tag schema with concrete examples.
- **[Risk]** User ends practice early after 2 rounds instead of 4.
  - *Mitigation*: Allow "Finish Early & Rate Recall" at any round, sending only the cards encountered so far to the manual rating step.
