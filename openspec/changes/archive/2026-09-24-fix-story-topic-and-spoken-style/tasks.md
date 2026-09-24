# Tasks

## 1. Prompt: demands-only topic resolution

- [x] 1.1 Add an exported `resolveStoryTopic(session)` helper to `src/prompts.js` that returns the trimmed `session.storyDemands` or an empty string, documented as the only topic channel for story passages; verify with new `prompts.test.js` cases for demands present, absent, and whitespace-only.
- [x] 1.2 Rework `generateStoryPassagePrompt` to build its topic instruction solely from `resolveStoryTopic` — named-topic grounding when non-empty, an explicit "pick a fresh concrete everyday topic" instruction when empty — and remove `session.title` from the prompt text; verify `prompts.test.js` asserts a date-shaped title (`Story — Sep 23, 2026`) never appears in the output.
- [x] 1.3 Keep the existing demands block, used-topics block, "ONLY the Russian story text" rule, learner level, and formality rules intact so the empty-demands branch still yields a usable passage; verify the full `prompts.test.js` story-prompt suite passes (`npx vitest run src/__tests__/prompts.test.js`).

## 2. Prompt: natural spoken register and no calendar dates

- [x] 2.1 Add the spoken-register requirement to the passage prompt (conversational spoken Russian a native speaker would say out loud, short spoken sentences, common everyday vocabulary and constructions, explicitly no literary/bookish/formal narration); verify a `prompts.test.js` case asserts the spoken-register wording.
- [x] 2.2 Add the calendar-date rule to the passage prompt (forbid the current date, current year, month names, and literal calendar dates; allow relative time words such as "yesterday" and "this morning"); verify a `prompts.test.js` case asserts the prohibition.
- [x] 2.3 Verify the demands path still matches the spec's "story passage honours learner demands" scenario by asserting the demands text and its "MUST match this request" instruction are present when `storyDemands` is set.

## 3. Session creation contract

- [x] 3.1 In `src/screens/Session.jsx`, keep the `Story — <date>` fallback title for sessions without demands and document it as a display-only label that is never prompt input; verify `Session.test.jsx` still asserts the `Story — ` title and empty `storyDemands` on the empty-demands path.
- [x] 3.2 Confirm `TranslationStorySession` still receives `session.storyDemands` and that `generateTranslationStoryPassage` in `src/services/aiService.js` passes the session through unchanged (update its JSDoc to name `storyDemands` as the topic source); verify the `Session.test.jsx` "threads story demands" case passes.

## 4. Integration verification

- [x] 4.1 Add an `aiService.test.js` case that composes the prompt for `{ title: 'Story — Sep 23, 2026', storyDemands: '' }` and asserts the OpenAI request body contains neither the date nor any part of the title while containing the everyday-topic and spoken-register instructions; verify with `npx vitest run src/__tests__/aiService.test.js`.
- [x] 4.2 Run the full suite and lint (`npm test`, `npm run lint`) and verify both pass with no new failures or warnings.
- [x] 4.3 Run `openspec validate fix-story-topic-and-spoken-style --strict` and verify the change validates with no errors.
