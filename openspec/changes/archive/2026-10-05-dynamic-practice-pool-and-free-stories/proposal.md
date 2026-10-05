# Proposal

## Why

During multi-round Russian practice sessions, learners encounter repetitive phrasing and unnatural, forced stories:
1. In **Translation Story Session**, the prompt explicitly hardcodes a small set of discourse markers (`"Короче"`, `"Представляешь"`, `"В общем"`, `"Оказывается"`), biasing the LLM to anchor almost every story on the exact same opening tropes.
2. In **Translation Practice Session**, the system forces arbitrary pairs of adjacent cards onto the LLM regardless of whether they fit together naturally, while the multi-round prompt history causes previous rounds' target constructions and story context to leak into subsequent rounds.

Refactoring Translation Story Session to generate natural spoken stories freely without hardcoded trope examples, and refactoring Translation Practice Session to provide a dynamic pool where the LLM picks 2 thematically compatible constructions and returns them in structured JSON before removing them from the pool, ensures natural stories and eliminates construction repetition across rounds.

## What Changes

- **Translation Story Session Prompting**:
  - Remove hardcoded discourse marker examples (`(e.g. "Короче", "Представляешь", "В общем", "Оказывается")`) from `generateStoryPassagePrompt`.
  - Emphasize natural conversational register and diverse spoken phrasing freely without fixed verbal crutches.

- **Translation Practice Dynamic Candidate Pool**:
  - Instead of client-side static sequential pairing (forcing card #1 and card #2 together), the client provides the candidate pool of target constructions to the LLM.
  - The LLM selects 2 constructions from the candidate pool that naturally fit together and writes a Russian passage embedding them with `[[Russian phrase|target]]` tags.
  - The LLM returns a structured JSON object containing the 2 picked constructions and the tagged Russian passage.
  - The client records the 2 picked constructions for evaluation and SRS rating, and removes them from the available candidate pool for subsequent rounds.
  - Generation requests for subsequent rounds are stateless and pass only the remaining pool, guaranteeing zero construction repetition or context leakage.
  - Expand the fallback card query when 0 cards are due from 5 to 20 cards, providing an ample pool for multiple practice rounds.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `translation-story-session`: Updates story generation requirements to remove hardcoded discourse markers and ensure free conversational styling.
- `russian-practice`: Updates multi-round translation practice requirements to support dynamic candidate pool selection by the LLM, structured JSON passage/pick response, pool reduction per round, and expanded fallback pool.

## Impact

- **UI / Screens**:
  - `src/screens/TranslationPracticeSession.jsx`: Manage dynamic `availableCards` pool, handle structured JSON passage replies, remove picked constructions per round, and pass practiced cards to onFinish/SRS ratings.
  - `src/screens/Practice.jsx`: Request up to 20 fallback cards when none are due.
- **AI Services & Prompts**:
  - `src/prompts.js`: Update `generateStoryPassagePrompt` to remove hardcoded phrase examples. Update/create prompt builder for dynamic candidate pool translation rounds.
  - `src/services/aiService.js`: Update `generateTranslationRoundPassage` to send the candidate pool, request structured JSON with picked constructions and tagged passage, and parse the result.
- **Tests**:
  - Update `src/__tests__/prompts.test.js`, `src/__tests__/aiService.test.js`, `src/__tests__/TranslationPracticeSession.test.jsx`, `src/__tests__/Practice.test.jsx`, and `src/__tests__/store.test.js`.
