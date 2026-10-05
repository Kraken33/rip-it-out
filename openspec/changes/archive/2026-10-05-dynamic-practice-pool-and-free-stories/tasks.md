# Tasks

## 1. Translation Story Session Prompting

- [x] 1.1 Remove hardcoded discourse marker examples `(e.g. "Короче", "Представляешь", "В общем", "Оказывается")` from `generateStoryPassagePrompt` in `src/prompts.js`, instructing the model to generate natural conversational Russian freely. Verify by running `npm test src/__tests__/prompts.test.js`.
- [x] 1.2 Update prompt tests in `src/__tests__/prompts.test.js` to assert that `generateStoryPassagePrompt` specifies conversational spoken register without anchoring on hardcoded marker strings. Verify tests pass with `npm test src/__tests__/prompts.test.js`.

## 2. Fallback Card Limit Expansion

- [x] 2.1 Update `getPracticeCards` in `src/store.js` to increase the default `fallbackLimit` from 5 to 20 when zero cards are due today. Verify with `npm test src/__tests__/store.test.js`.
- [x] 2.2 Update fallback behavior unit tests in `src/__tests__/store.test.js` to reflect the expanded 20-card fallback limit. Verify tests pass with `npm test src/__tests__/store.test.js`.

## 3. Dynamic Candidate Pool Prompt & Service

- [x] 3.1 Update `generateTranslationRoundPassage` in `src/services/aiService.js` to accept the candidate card pool, instruct the LLM to choose 2 thematically compatible constructions and return structured JSON (`{ "picked": [...], "passage": "..." }`) with `[[Russian phrase|target]]` tags, and parse the response.
- [x] 3.2 Add unit tests in `src/__tests__/aiService.test.js` covering dynamic candidate pool prompt formatting, structured JSON response parsing, and error handling. Verify tests pass with `npm test src/__tests__/aiService.test.js`.

## 4. Translation Practice Session Candidate Pool State

- [x] 4.1 Update `TranslationPracticeSession.jsx` to maintain `availableCards`, pass them to `generateTranslationRoundPassage`, match `picked` strings back to card objects, filter out picked cards upon round completion, and repopulate if fewer than 2 remain.
- [x] 4.2 Update `TranslationPracticeSession.test.jsx` and `Practice.test.jsx` to mock the dynamic pool response, test card reduction across multiple rounds, and confirm practiced cards are passed to `onFinish`. Verify tests pass with `npm test src/__tests__/TranslationPracticeSession.test.jsx src/__tests__/Practice.test.jsx`.

## 5. Verification & Regressions

- [x] 5.1 Run the full test suite (`npm test`) and code linting to ensure all specs pass and no regressions exist across other practice or session modes.
