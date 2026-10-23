# Design: Frequency Sentence Practice Explain & Deep Practice System

## Context

See `proposal.md` for background and user motivation.
Currently, `FrequencyPracticeSession.jsx` mixes flashcard triage with an inline mini-drill session that triggers when a card is rated `Again` (1) or `Hard` (2). It only generates a single sentence variation translation drill. We are replacing that workflow with a non-blocking card rating experience and a rich, on-demand 3-tab modal (`ExplainPracticeModal.jsx`).

## Goals / Non-Goals

**Goals:**
- Provide instant, non-blocking SRS triage when rating cards (Again, Hard, Good, Easy) without forcing users into drills.
- Expose an on-demand "Explain & Practice" button on revealed cards.
- Implement a 3-tab modal (`Explanation`, `Examples`, `Practice`) with persistent in-memory caching for zero latency between tabs and re-openings.
- Provide a unified single-roundtrip prompt to generate explanation, initial examples, and practice exercises upfront.
- Support multi-exercise practice: Translation drills (with text and voice speech-to-text) and Cloze / fill-in-the-blank exercises with rich AI evaluation.

**Non-Goals:**
- Modifying standard flashcard review screens (`Review.jsx`) or story sessions (`TranslationStorySession.jsx`).
- Server-side database persistence for generated explanations (in-memory caching per browser session is sufficient and avoids localStorage bloat).

## Decisions

### 1. Dedicated Component: `ExplainPracticeModal.jsx`
- **Rationale**: `FrequencyPracticeSession.jsx` is already ~800 lines. Isolating the 3-tab modal into a standalone component (`src/components/ExplainPracticeModal.jsx` or `src/screens/FrequencyPracticeSession/ExplainPracticeModal.jsx`) keeps code modular, readable, and cleanly testable.
- **Alternatives Considered**: Keeping everything inline inside `FrequencyPracticeSession.jsx` (creates bloated, fragile component with too many states).

### 2. Unified Upfront Generation (`generateSentenceDeepStudyPrompt`)
- **Rationale**: Fetching explanation, 3–4 examples, and initial practice exercises in a single LLM request (`deepStudyPrompt`) eliminates loading spinners when switching tabs and reduces total API roundtrips and token overhead.
- **Schema**:
  ```json
  {
    "explanation": {
      "overallMeaning": "...",
      "nuances": "...",
      "vocabulary": [
        { "term": "...", "role": "...", "caseOrAspect": "...", "meaning": "..." }
      ],
      "usage": { "formality": "...", "context": "..." }
    },
    "examples": [
      { "ru": "...", "en": "...", "contextType": "question / negation / tense variation" }
    ],
    "practice": {
      "translation": { "prompt": "...", "reference": "...", "direction": "ru-en" },
      "cloze": { "sentenceWithBlank": "...", "blankTarget": "...", "promptTranslation": "...", "hint": "..." }
    }
  }
  ```
- **Alternatives Considered**: Lazy loading per tab (requires loading spinners on every tab click, frustrating user flow).

### 3. Practice Evaluation Handler
- **Rationale**: Reuse and extend the evaluation engine for both free-form translation and cloze attempts. Cloze checks whether the student correctly supplied the target grammatical inflection or keyword while accepting natural synonyms or minor typos when appropriate.
- **Evaluation Payload**:
  - `verdict`: `'natural' | 'acceptable' | 'incorrect'`
  - `isAccurate`: boolean
  - `naturalRewrite`: corrected string
  - `explanation`: clear grammatical explanation

### 4. Session-Level In-Memory Cache
- **Rationale**: Use an in-memory `Map` (keyed by `${sentence.ru}::${sentence.en}`) inside the practice session to store generated study payloads. Reopening the modal for a previously explored sentence renders instantly without any network or token cost.
- **Alternatives Considered**: LocalStorage persistence (unnecessary quota consumption for dynamic explanations that can be generated on-demand).

## Risks / Trade-offs

- **[Risk] LLM response JSON parsing failure or schema mismatch** → *Mitigation*: Robust JSON extraction and fallback parser in `src/prompts.js` with defensive validation, ensuring partial failures (e.g. malformed cloze) still render the explanation and examples gracefully.
- **[Risk] Speech-to-text integration during practice** → *Mitigation*: Re-use existing `AudioRecorder` component which connects with the app's audio transcription service and handles permission/error states reliably.
- **[Risk] Large token count in single upfront prompt** → *Mitigation*: Keep prompt constrained to 3-4 concise examples and 2 exercises, setting `max_tokens` appropriately (~1000 tokens) with concise instructions.
