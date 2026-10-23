# Proposal: Frequency Sentence Practice Explain & Deep Practice System

## Why

Currently, during frequency sentence practice, rating a card as `Again` or `Hard` automatically locks the learner into an AI mini-drill session that only provides isolated sentence variations to translate. Learners need a more comprehensive, learner-directed way to deeply understand challenging sentences—including detailed explanations of meaning, grammar, and vocabulary nuances, multiple contextual examples with audio, and interactive multi-type practice with evaluation—without disrupting the rapid flow of flashcard triage.

## What Changes

- **On-Demand Access**: Add a dedicated "Explain & Practice" button on revealed frequency cards so learners can choose when to enter deep study mode.
- **Uninterrupted SRS Triage**: Rating a card as `Again` (1) or `Hard` (2) will now save the card to SRS with initial review scheduling and advance immediately to the next card, rather than automatically forcing a drill.
- **Comprehensive 3-Tab Learning Interface**:
  - **Explanation Tab**: In-depth breakdown of sentence meaning, literal vs. natural nuances, vocabulary/collocations table (with grammar roles, cases, verb aspects), and situational register/formality notes with audio playback.
  - **Examples Tab**: 3–4 diverse contextual sentence examples (questions, negations, varied tenses/persons) with Russian, English, audio buttons, and an on-demand "Generate More Examples" action.
  - **Practice Tab**: Multi-exercise practice containing both Translation Drills (type/speak via audio transcription) and Fill-in-the-blank / Cloze challenges, backed by detailed AI evaluation (accuracy verdict, natural phrasing with audio, grammatical explanation of mistakes), plus "Retry" and "Try Another Exercise" options.
- **Unified Generation & In-Memory Caching**: AI content for Explanation, Examples, and initial Practice exercises is generated in a single prompt and cached in memory per sentence during the session for instant tab transitions and zero-latency revisits.

## Capabilities

### Modified Capabilities
- `frequency-sentence-practice`: Update triage behavior so `Hard` and `Again` advance immediately to the next card after saving to SRS, and replace the auto-triggered mini-drill with the on-demand 3-tab "Explain & Practice" system (Explanation, Contextual Examples, and Multi-Exercise Practice & Evaluation).

## Impact

- **UI Screens & Components**: `src/screens/FrequencyPracticeSession.jsx` (and potentially dedicated subcomponents/modals for Explain & Practice).
- **AI Services & Prompts**: `src/prompts.js` and `src/services/aiService.js` (new unified prompt and parser for explanation + examples + practice, plus cloze/translation evaluation prompts).
- **Specs & Tests**: `openspec/specs/frequency-sentence-practice/spec.md`, `src/__tests__/FrequencyPracticeSession.test.jsx`, `src/__tests__/aiService.test.js`, and `src/__tests__/prompts.test.js`.
