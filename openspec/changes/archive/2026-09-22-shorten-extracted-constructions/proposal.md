# Proposal

## Why

During AI evaluation, the extracted `construction` patterns are often long, multi-clause sentences (e.g. `"If I wake up at [time], I feel [adjective] and like I haven't had enough sleep"`) instead of short, reusable patterns (e.g. `"start taking [class] to [purpose]"`). Long patterns are bad flashcards: they encode one specific situation rather than a reusable structure, are hard to memorize, and clutter the card front and practice prompts. The extraction prompts never state a length or brevity constraint, so the model copies near-full sentences into the `construction` field.

## What Changes

- Add an explicit brevity constraint for the `construction` field to the seamless AI evaluation prompt in `generateSeamlessSessionFeedback` (`src/services/aiService.js`): the pattern MUST be short (a single compact phrase structure, roughly 2–7 words, one clause), with a good example and a counter-example.
- Add the same brevity constraint to Prompt #1 (description/review) and Prompt #2 (export JSON) in `src/prompts.js` so prompt-mode extraction stays consistent with AI evaluation.
- Update unit tests to assert the brevity instruction is present in all three prompts.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `prompt-orchestrator`: The Prompt Generation requirement gains a constraint that extracted construction patterns must be short, single-clause patterns (with good/bad examples) in Prompt #1 and Prompt #2.
- `ai-seamless-integration`: Adds a new requirement constraining the seamless evaluation prompt (`generateSeamlessSessionFeedback`) to instruct short, single-clause construction patterns. (Added rather than modified because the main spec's legacy numbered headers — `### Requirement 3: ...` — are not matchable by the current CLI's archive-time MODIFIED parser.)

## Impact

- **Code**: `src/services/aiService.js` (system prompt text in `generateSeamlessSessionFeedback`), `src/prompts.js` (`generateDescriptionPrompt`, `generateExportPrompt`).
- **Tests**: `src/__tests__/aiService.test.js`, `src/__tests__/prompts.test.js` — new assertions on the brevity instruction.
- **Behavioral**: Only prompt wording changes; no API, schema, storage, or UI changes. Existing stored improvements are untouched — the constraint applies to newly extracted constructions only.
