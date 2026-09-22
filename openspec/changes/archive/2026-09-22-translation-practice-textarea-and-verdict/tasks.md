# Tasks

## 1. Parser foundation

- [x] 1.1 Extract the markdown-fence/brace JSON extraction out of `parseImportJSON` in `src/prompts.js` into a shared `extractJsonObject(text)` helper and reuse it there; verify the existing cases in `src/__tests__/prompts.test.js` still pass unchanged (`npm test -- prompts`).
- [x] 1.2 Implement `parseTranslationVerdict(text)` in `src/prompts.js` that validates `verdict.constructions` (non-empty array, each entry has a string `target` and boolean `used`, optional string `mine`/`better`/`note`) and returns success for a verdict where every target is natural and `rewrite_needed` is false; verify with new unit tests in `src/__tests__/prompts.test.js` covering: a valid all-natural verdict, a valid verdict with awkward and missing targets, fenced JSON, raw JSON with surrounding prose, a payload missing the `constructions` array, and a payload that fails to parse.

## 2. Service layer

- [x] 2.1 Implement `generateTranslationRoundPassage(roundCards, settings)` in `src/services/aiService.js` containing only the passage-writing instructions (Russian prose, `[[Russian phrase|target construction]]` tags, `temperature: 0.7`) and no evaluation rule; verify with a unit test in `src/__tests__/aiService.test.js` asserting the request body's system prompt contains the tag-format instruction and the round cards, that the request uses temperature 0.7, and that a missing API key rejects with the existing "No API Key configured" error.
- [x] 2.2 Implement `evaluateTranslationRound(roundCards, passageText, userTranslation, settings)` in `src/services/aiService.js` returning the raw reply: verdict JSON instructions including the "do not invent changes when the translation is already natural" rule, one entry per target with `used`/`quality`, `temperature: 0.3`, `max_tokens: 8000`, and the reasoning-model empty-content error path; verify with unit tests asserting the system prompt contains both the no-invented-corrections rule and the passed passage text, that the request uses temperature 0.3 and max_tokens 8000, that an empty `content` with a populated `reasoning` field surfaces the "ran out of tokens" error, and that a non-OK response surfaces the API error message.
- [x] 2.3 Remove `streamTranslationPracticeCompletion` and its obsolete tests from `src/services/aiService.js` and `src/__tests__/aiService.test.js`; verify `npm test -- aiService` passes and `grep -rn "streamTranslationPracticeCompletion" src/` returns nothing.

## 3. Multi-line translation input

- [x] 3.1 Replace the single-line `<input type="text">` in `src/screens/TranslationPracticeSession.jsx` with a text area (initial height via `rows`, auto-grow from `scrollHeight` up to a maximum height, `resize-y`); verify by a component test that typing a multi-sentence translation preserves its line breaks in the submitted message and that the control is a `textarea`, not a text box.
- [x] 3.2 Make submission explicit: Enter inserts a newline and sends nothing, while the Translate button and `Ctrl/Cmd+Enter` submit; verify by component tests that pressing Enter alone does not call the service and that `{ctrlKey: true}` + Enter does.
- [x] 3.3 Insert transcribed speech at the caret position instead of appending to the end of the text; verify by a component test that a transcription lands between existing typed fragments and that both parts are present in the submitted message.
- [x] 3.4 Preserve the existing submission guards: whitespace-only input and an in-flight evaluation neither send a request nor clear the text; verify by a component test that submits whitespace and asserts no service call plus retained text.

## 4. Verdict rendering in the round thread

- [x] 4.1 Extend the thread item model with an explicit verdict field and branch the rendering on it (assistant item with verdict -> verdict card, assistant item without -> tagged passage bubble via `parseTaggedPassage`, user item -> plain text with newlines); verify by a component test that a passage message still renders its construction badges while the verdict renders as a card.
- [x] 4.2 Render the verdict card contents: overall summary, one coverage badge per round target classified as natural / awkward / missing, the rewritten sentence when a rewrite is warranted, and notes only for awkward and missing targets; verify by component tests for an all-natural verdict (badges present, no rewrite block), a verdict with one awkward and one missing target (notes only for those two, rewrite block present), and that the badges match the round's target list.
- [x] 4.3 Show the learner's submitted translation in the thread immediately and display an explicit evaluating state while the verdict is in flight, replacing the typing-effect placeholder; verify by a component test asserting the evaluating indicator is present before the service resolves and gone afterwards.
- [x] 4.4 Handle an uninterpretable evaluation: render the raw reply as plain feedback with a notice that structured evaluation was unavailable, and provide a retry control that re-runs the evaluation against the retained translation; verify by component tests that the raw text is displayed and that activating retry issues a second evaluation call.
- [x] 4.5 Keep verdict JSON out of the passage-generation history: send only passages and learner translations to `generateTranslationRoundPassage`, and pass the current round's passage text and translation explicitly to `evaluateTranslationRound`; verify by a component test that after a verdict round, the next round's passage call receives no verdict payload.

## 5. Round-loading effect guard

- [x] 5.1 Guard the round-loading effect so `StrictMode`'s double invocation issues at most one passage request per round; verify by a component test that renders under `StrictMode` and asserts `generateTranslationRoundPassage` was called once for round 1.

## 6. Verification

- [x] 6.1 Update `src/__tests__/TranslationPracticeSession.test.jsx` to mock both new service functions instead of the removed one, keeping the existing header, passage-badge, and Finish assertions passing.
- [x] 6.2 Run the full suite (`npm test`) and confirm every test in `src/__tests__/` passes with no unhandled rejections referencing the removed service function.
- [x] 6.3 Run `npm run lint` and `npm run build` and confirm both succeed with no new warnings from the changed files.
- [x] 6.4 Confirm no scope leaked outside the in-app session: this change touches only `src/screens/TranslationPracticeSession.jsx`, `src/services/aiService.js`, `src/prompts.js`, `src/__tests__/TranslationPracticeSession.test.jsx`, `src/__tests__/aiService.test.js`, `src/__tests__/prompts.test.js`, and the shared aiService mock in `src/__tests__/Practice.test.jsx`; the other entries in `git diff --stat` (`Practice.jsx`, `Review.jsx`, `store.js`, `Review.test.jsx`, `store.test.js`, `openspec/specs/*`) are pre-existing uncommitted work from 09-21 about `getPracticeCards`, unrelated to and untouched by this change.
