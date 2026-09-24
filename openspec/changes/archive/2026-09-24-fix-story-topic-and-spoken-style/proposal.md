# Proposal

## Why

When a story-translation session starts without learner-provided story demands, `Session.jsx` saves it with an auto-generated date title (`Story — Sep 23, 2026`) and `generateStoryPassagePrompt` grounds the story in `session.title` — the only topic source it has. The model therefore receives the topic `Story — Sep 23, 2026` and writes passages about the current date instead of everyday speech, which is what learners actually see ("It's 23 September 2026..."). The same passages also read like written/literary Russian rather than the natural conversational register the activity is meant to drill.

## What Changes

- **Demands-only story topic resolution**: `session.storyDemands` (the optional Step-1 text) becomes the ONLY topic input for `generateStoryPassagePrompt`. When it is empty, the prompt asks for a fresh free everyday subject instead of falling back to the session title.
- **Auto-generated session titles become display-only**: the date-based fallback title is still saved so Library/replay can label the session, but no part of it may reach the model as a topic constraint. No schema change, no migration, no change to the title format or topic grouping.
- **Natural spoken Russian passages**: the passage prompt explicitly requires conversational, spoken-register Russian (short spoken sentences, common everyday vocabulary, natural spoken constructions, no literary/bookish narration).
- **No calendar-date leakage**: the passage prompt explicitly forbids mentioning the current date, year, month name, or a literal calendar date, while still allowing ordinary relative time words ("yesterday", "this morning") so the speech stays natural.
- **Regression coverage**: prompt-builder tests for demands-only grounding, free-topic fallback with a date-shaped title, spoken-register instruction, and the no-calendar-date rule; plus an `aiService` request-body test proving a date-shaped session title never appears in the built messages.

## Capabilities

### New Capabilities

(none — all changes land in existing capabilities)

### Modified Capabilities

- `ai-seamless-integration`: the "Story passage generation prompt" requirement now states that the passage is grounded solely in learner-provided topic/demands with a free-topic fallback, must be in natural spoken Russian, must not reference the calendar date, and must never receive the auto-generated session title as a topic.
- `translation-story-session`: the "Unlimited story-translation rounds" requirement drops title-based grounding for the first round — a session without demands gets free-topic stories in the spoken register.
- `session-flow`: adds a requirement making the auto-generated story session title display-only, so it is never used as AI prompt input.

## Impact

- `src/prompts.js` — `generateStoryPassagePrompt` topic resolution (new exported `resolveStoryTopic` helper), spoken-register rules, no-calendar-date rule.
- `src/screens/Session.jsx` — date-fallback title stays, now documented as display-only (no data-shape change).
- `src/services/aiService.js` — documentation only; `generateTranslationStoryPassage` keeps passing `session.storyDemands` through unchanged.
- Tests: `src/__tests__/prompts.test.js`, `src/__tests__/aiService.test.js`, `src/__tests__/Session.test.jsx`.
