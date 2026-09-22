# Proposal

## Why

The in-app Russian→English Translation Practice session asks the learner to translate a whole Russian passage, but collects the answer in a single-line `<input type="text">` that submits on Enter — so a multi-sentence translation can neither be typed comfortably nor read back before sending. Its evaluation is also an unstructured prose blob that never shows a corrected version of what the learner actually wrote, so a round can end with criticism but nothing to imitate.

## What Changes

- Replace the single-line translation input with an auto-growing multiline text area: Enter inserts a newline, submission happens through the Translate button or `Cmd/Ctrl+Enter`, and dictated speech is inserted at the caret instead of being appended blindly.
- Split the overloaded `streamTranslationPracticeCompletion` service call into two single-purpose calls: Russian passage generation (prose with `[[Russian phrase|target construction]]` tags, unchanged output format) and translation evaluation (structured JSON verdict).
- Add an evaluation verdict contract that always covers every target construction of the round, distinguishing `natural` usage from `awkward` usage from a target that was never used, plus a one-line summary, a rewrite of the learner's own translation, and short notes.
- Render the verdict as a compact card inside the session thread: per-target coverage badges, summary, the rewritten sentence only when a rewrite is warranted, and notes only for awkward or missing targets.
- Guarantee the evaluator does not fabricate changes: when the translation is already natural and uses the targets correctly, the verdict reports that instead of proposing a rewrite.
- Preserve the session's existing handoff to manual SRS rating (`Finish & Rate Recall`) and keep the Russian passage rendering with construction badges unchanged.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `russian-practice`: the in-app Seamless AI scenario of requirement *Dual Mode Execution (Seamless and Prompt-based)* changes from "accepts user typed or spoken English translations, provides immediate feedback per round" to accepting a multi-line translation and returning a structured verdict; two new requirements are added for the multi-line translation input and for the verdict evaluation contract. The Prompt #5 (external LLM) side of that requirement is explicitly unchanged.

## Impact

- `src/screens/TranslationPracticeSession.jsx` — input control, submit paths, verdict message rendering, evaluation/fallback states.
- `src/services/aiService.js` — replaces `streamTranslationPracticeCompletion` with passage-generation and evaluation functions carrying separate temperature, token budgets, and output contracts.
- `src/prompts.js` — adds a verdict parser and a shared JSON-extraction helper; `parseImportJSON`, Prompt #3 and Prompt #5 are untouched.
- `src/__tests__/aiService.test.js` — the `streamTranslationPracticeCompletion` suite is replaced by suites for the two new functions.
- `src/__tests__/TranslationPracticeSession.test.jsx` — service mock updated; new coverage for multi-line submit behaviour and verdict card rendering.
- Behavior outside the in-app session (Prompt #5 text in `prompts.js`, the JSON import flow in `src/screens/Session.jsx`, SRS scheduling, storage schema) is unaffected.
