# Tasks

## 1. Extraction prompt and parser

- [x] 1.1 Add a `generateConstructionExtractionPrompt(selection, sourceBlock, passage, settings)` builder to `src/prompts.js` that requests exactly ONE construction in the vault improvement shape, requires a single-clause 2-7 word bracket-slot pattern (with a long multi-clause counter-example), forbids whole sentences, requires an empty `original`, and carries the learner level plus the round's Russian passage when given; verify with unit tests asserting the selection text, the source block, the level, the passage, the short-pattern rule, and the counter-example all appear in the request.
- [x] 1.2 Add `parseExtractedConstruction(text)` to `src/prompts.js` reusing `extractJsonObject` and the existing category/spoken-frequency allow-lists with defaults, requiring a non-empty `construction` and `improved`, and forcing `original: ''`; verify unit tests cover a valid response, an invented category and frequency, a missing construction, and non-JSON text.
- [x] 1.3 Drop the constructions section from `generateStoryFeedbackPrompt` and the construction parsing plus `STORY_ROUND_CONSTRUCTION_CAP` handling from `parseStoryFeedback` in `src/prompts.js`; verify `npm test -- prompts` passes with the story-feedback assertions updated to require summary and improved version only.

## 2. Extraction request

- [ ] 2.1 Add `extractConstruction({ selectedText, sourceText, passage, settings })` to `src/services/aiService.js` calling the existing `requestOpenAIChat` with `temperature: 0.2` and `maxTokens: 1000`, reusing the configured model and the existing no-key and token-limit error handling; verify tests assert the OpenAI chat endpoint, the configured model, the Authorization header, the temperature, and that an empty response raises the token-limit error message.
- [ ] 2.2 Delete `generateSeamlessSessionFeedback` from `src/services/aiService.js` and its now-unused imports; verify `npm test -- aiService` passes and a search for the function name returns no source references.

## 3. Vault write guard

- [ ] 3.1 Make the duplicate lookup in `src/store.js` null-safe and match on the construction instead of `original` (today it dereferences `i.original.toLowerCase()` for every stored improvement); verify `store.test.js` covers an existing improvement with an empty `original` without throwing, a matching construction being reported, and a distinct construction not being reported.

## 4. Extraction component

- [ ] 4.1 Create `src/components/ConstructionExtractor.jsx` taking `{ sessionId, settings, sourceText, passage }` and rendering a preview card beneath its source block with construction, improved example, explanation, category, and spoken frequency, plus an add action and a discard action; verify a component test renders the extracted fields and that discarding removes the card without any vault write.
- [ ] 4.2 Implement selection capture inside the component's own container (`mouseup`/`keyup`, range containment via `commonAncestorContainer`, `preventDefault()` on the trigger's mousedown) and disable the control otherwise; verify tests assert the control is absent without an OpenAI key, disabled with no selection, disabled for a selection outside the block, and enabled after a range is seeded inside the block.
- [ ] 4.3 Wire the pending and add paths: one request at a time, then `addImprovements(sessionId, [item])` with `original: ''` and the source block as `context`; verify tests assert the request runs once while pending, that Add writes the improvement and its SRS card, and that nothing is written before Add.
- [ ] 4.4 Implement the duplicate and unparsable states; verify tests assert an existing construction reports "already saved" and writes nothing, and that an uninterpretable response shows the raw text with a retry action that reissues the request.

## 5. Wire both screens

- [ ] 5.1 In `src/screens/TranslationStorySession.jsx` mount one extractor inside the improved-version block and remove the constructions list from `StoryFeedbackCard`; verify `TranslationStorySession.test.jsx` asserts the improved version carries an extraction control, no construction list is rendered, and the obsolete aggregation tests are gone.
- [ ] 5.2 In `src/screens/SeamlessChatSession.jsx` mount one extractor with each assistant message and disable it while that message is still streaming; verify `SeamlessChatSession.test.jsx` asserts one control per settled coach reply.

## 6. Remove the automatic construction paths

- [ ] 6.1 Collapse the story finish in `src/screens/Session.jsx`: delete `aggregateStoryConstructions` and the aggregation route, keep the session save (activity, rounds, learner-only `rawText`, duration and activity log), then return to the Dashboard; verify `Session.test.jsx` asserts no import step appears and the Dashboard route is reached.
- [ ] 6.2 Collapse the dialogue finish: delete `handleSeamlessFinish`, the Step-3 analysis screen, and the feedback handoff from `SeamlessChatSession`, keeping the session text, duration, and activity save; verify `Session.test.jsx` asserts finishing a dialogue session saves and exits with no analysis screen.
- [ ] 6.3 Hide the `Original` line when empty in `src/screens/Library.jsx`, `src/screens/Review.jsx`, and `Session.jsx`, and drop the dead constructions section from `src/screens/TranslationStoryViewerModal.jsx`; verify tests render a harvested improvement without an `Original` label and the story replay without a constructions block.

## 7. Whole-suite verification

- [ ] 7.1 Run `npm test`, `npm run lint`, and `npm run build`; verify all three pass with no references to the removed aggregation, sweep, or cap behaviour.
- [ ] 7.2 Run `openspec validate selection-construction-extraction --strict` and confirm the change validates; verify the prompt-mode paste-JSON flow still reaches the Review & Confirm picker in `Session.test.jsx`.
