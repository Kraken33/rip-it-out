# Proposal

## Why

Both AI session activities choose constructions *for* the learner: Story Translation asks the model for up to 3 candidates per round (`generateStoryFeedbackPrompt`), and Free Dialogue runs one whole-session sweep capped at `settings.maxImprovements` (`generateSeamlessSessionFeedback`). The learner can only tick or drop what the model decided — the phrase they actually noticed while reading the improved version is usually missing, and unwanted items pad the list. The app already provides a more precise instrument the learner fully controls: the text they select.

## What Changes

- Add a selection-scoped extraction control: an `✨ Extract construction` button inside each improved-version block in Story Translation and under each AI coach reply in Free Dialogue, active only while the current text selection sits inside that same block.
- **BREAKING** Story Translation stops generating candidate constructions: per-round feedback keeps the summary and the fluent improved version only, and the `constructions` list, its per-round cap, and end-of-session aggregation are removed. `Finish Story` saves the session and returns to the Dashboard instead of routing through the Step-4 picker.
- **BREAKING** Free Dialogue stops running an end-of-session evaluation sweep: `Finish Conversation` saves the session text, duration, and activity log, then returns to the Dashboard. The Step-3 analysis screen and its Step-4 review are removed from that path.
- Add an in-app extraction request that turns the selected phrase — plus the block it came from, the learner level, and the round's Russian passage when present — into one construction in the existing vault shape. `original` is empty (nothing is being corrected), and every `Original` render is hidden when it is empty.
- Preview the extracted construction read-only under its source block with `Add to Study List` and `Discard`. Adding writes it straight to the vault via `addImprovements(session.id, [...])`, creating its SRS card and surfacing it in Library under that session. A construction already in the vault is flagged instead of added twice, and an unparsable response shows the raw model text with `Retry`.
- Prompt Copy/Paste mode is deliberately unchanged: Prompts #1/#2, the JSON paste, and the Step-4 selective import picker stay exactly as they are, preserving the no-API-key route to the vault. The extraction button is not offered without an OpenAI key.

## Capabilities

### New Capabilities

- `construction-harvesting`: learner-driven extraction of a single construction from a selected phrase in AI-written session text, its preview, duplicate handling, and its direct write into the vault.

### Modified Capabilities

- `translation-story-session`: per-round feedback returns an improved version without candidate constructions; the end-of-session aggregation requirement is removed; the saved session artefact no longer carries per-round constructions.
- `ai-seamless-integration`: the dialogue end-of-session analysis scenario is removed from the finish flow; the per-round story feedback prompt and the whole-session aggregation requirement drop their construction duties; the short-construction prompt constraint moves to the extraction request.
- `session-flow`: the story activity no longer ends in Step 4, and the shell wording is narrowed so Step 4 is the Prompt Copy/Paste import step only.

## Impact

- `src/screens/TranslationStorySession.jsx`: `StoryFeedbackCard` loses its constructions list; `aggregateStoryConstructions` and `STORY_ROUND_CONSTRUCTION_CAP` usage removed; extraction control added to the improved-version block.
- `src/screens/SeamlessChatSession.jsx`: extraction control added to assistant replies; `onFinish` no longer hands the transcript to a feedback step.
- `src/screens/Session.jsx`: `handleSeamlessFinish` and `handleTranslationFinish` collapse to save-and-exit for the AI paths; Step-3 spinner removed; Step-4 picker retained for prompt mode only; its unguarded `Original` render guarded.
- `src/services/aiService.js`: `generateSeamlessSessionFeedback` removed; new extraction request added.
- `src/prompts.js`: `generateStoryFeedbackPrompt` and `parseStoryFeedback` drop constructions; new extraction prompt builder and parser added, reusing `extractJsonObject`.
- `src/store.js`: `findDuplicate` corrected to tolerate empty `original` and to match on a construction.
- `src/screens/TranslationStoryViewerModal.jsx`: dead per-round constructions section removed.
- `src/screens/Library.jsx`, `src/screens/Review.jsx`: `Original` line hidden when empty.
- Tests: `TranslationStorySession.test.jsx` (aggregation tests removed), `Session.test.jsx` (prompt-mode picker tests kept, story-aggregation tests removed), `prompts.test.js`, `aiService.test.js`, plus new coverage for the extraction control, prompt, and parser.
