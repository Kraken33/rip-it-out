# Proposal

## Why

Users practicing English constructions need a focused, active translation exercise that tests their ability to translate Russian passages with targeted constructions into natural spoken English. While scenario questions (Prompt #3) provide open-ended Q&A, a multi-round Russian-to-English translation practice mode gives direct target-construction reinforcement, visually highlighting upcoming SRS constructions in Russian text and evaluating English translations across both in-app Seamless AI sessions and external LLM copy/paste prompts.

## What Changes

- **Multi-Round Russian Translation Practice**: Add a new practice mode that fetches top ~20 SRS cards/constructions and organizes them into 4-5 rounds (3-5 target constructions per passage).
- **Russian Passage & Construction Highlighting**: LLM generates Russian passages containing highlighted target constructions (using bracket markers e.g. `[[Russian phrase|target construction]]` parsed into visual UI badges/pills).
- **Dual Mode Availability**:
  - **Seamless AI Mode (In-App)**: Direct interactive multi-round session streaming Russian passages, accepting user voice (Whisper) or typed English translations, and evaluating accuracy round by round.
  - **Prompt #5 Generator**: Generates a dedicated Copy/Paste prompt (Prompt #5) for external LLMs (ChatGPT/Claude) to execute the multi-round translation practice exercise.
- **Manual SRS Recall Rating Handoff**: After completing translation rounds, users transition directly to the manual SRS rating interface to score recall (1-4: Again, Hard, Good, Easy) for all practiced cards.
- **Practice Screen Navigation**: Allow switching between Scenario Practice (Prompt #3) and Translation Practice (Prompt #5 / Seamless Translation).

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `russian-practice`: Extend Russian practice capability to support multi-round Russian-to-English translation exercises, target construction highlighting, and dual (Seamless AI / Prompt-based) execution alongside existing scenario questions.

## Impact

- **UI Screens**: Updates to `src/screens/Practice.jsx`, addition of `src/screens/TranslationPracticeSession.jsx` (or reusable modal/view), and navigation updates.
- **Prompts & AI Service**: Addition of `generateTranslationPracticePrompt` in `src/prompts.js` and streaming/completion helper `streamTranslationPracticeCompletion` in `src/services/aiService.js`.
- **Parsing Utilities**: Helper utilities to parse highlighted construction markers in Russian passages (`src/textAnnotator.js` or dedicated helper).
- **Data & SRS Store**: Card queue selection in `src/store.js` for top 20 SRS items batched into rounds.
