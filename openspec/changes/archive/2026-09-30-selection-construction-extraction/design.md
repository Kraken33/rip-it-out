# Design

## Context

See `proposal.md` — Why. Current state that shapes the approach:

- One shell drives both AI activities: `Session.jsx` runs Step 1 (setup) → Step 2 (activity branch) → Step 3 (analysis or prompt export) → Step 4 (Review & Confirm). Story Translation mounts `TranslationStorySession` in Step 2 and pushes aggregated constructions into the shared Step-4 picker; Free Dialogue mounts `SeamlessChatSession` and runs `generateSeamlessSessionFeedback` on Finish. The picker state (`parsedImprovements`, `selectedIds`) is also the import surface for pasted prompt JSON.
- The vault shape is `{ construction, original, improved, explanation, category, spoken_frequency, context }` written by `addImprovements(sessionId, items)` (`store.js:383`), which also creates the SRS card and sets `session.status = 'imported'`.
- `Library.jsx:97` loads improvements by session, so a write carrying the session id is visible there with no extra work.
- Selection plumbing today exists only for textareas (`selectionStart`/`selectionEnd` in `insertTranscription`); nothing reads rendered-text selections. happy-dom implements `Selection`/`Range` including `commonAncestorContainer` containment, so this behaviour is testable in the existing vitest + RTL setup.
- `prompts.js` owns the shared pieces we need: the category and spoken-frequency allow-lists, `extractJsonObject`, and the 2-7 word bracket-slot construction rule.

## Goals / Non-Goals

**Goals:**

- One reusable extraction control shared by both screens, with identical behaviour.
- No new persistence: reuse the existing improvement store and its SRS-card creation.
- Remove automatic construction generation end to end (prompt sections, parsers, caps, aggregation, and the AI paths into Step 4) rather than merely hiding it.

**Non-Goals:**

- Changing Prompt Copy/Paste: Prompts #1-#4, the JSON paste, and the Step-4 picker stay as they are.
- Changing translation practice (`TranslationPracticeSession`) or its spec.
- A floating selection popover or portal-based toolbar.
- Editing extracted fields before saving.
- Making the Story Translation activity respect the Mode toggle (pre-existing, unrelated).

## Decisions

### 1. One shared component rather than two implementations

`src/components/ConstructionExtractor.jsx` renders the trigger plus its pending, preview, saved, and unparsable states. It receives `{ sessionId, settings, sourceText, passage }` and owns both the selection check and the request. `TranslationStorySession` mounts one inside each improved-version block; `SeamlessChatSession` mounts one with each assistant message. Alternative rejected: implementing the control twice, since only the surrounding layout differs while behaviour, parsing, and duplicate handling would be duplicated.

### 2. Selection capture on the block, evaluated against the block's own range

The component captures the last selection made inside its own container on `mouseup` and `keyup`, and stores the selected text plus its range. Containment is checked by walking up from `range.commonAncestorContainer` to the component's container. Alternatives rejected: reading `window.getSelection()` at click time (by then a mousedown elsewhere has usually cleared it, and the click itself risks collapsing it), listening to the global `selectionchange` event (fires for every change on the page, and the coach reply streams token by token, invalidating ranges mid-stream), and a floating popover (needs `getBoundingClientRect`, portals, and scroll-container math, and still needs a touch/keyboard fallback). The trigger also calls `preventDefault()` on mousedown so the browser keeps the visual selection while the control is used.

### 3. One new chat request reusing the existing transport

`aiService.extractConstruction({ selectedText, sourceText, passage, settings })` builds its system prompt through a new `prompts.js` builder and calls the existing `requestOpenAIChat` with `temperature: 0.2` and `maxTokens: 1000`. Rationale: it inherits the no-key error, model selection, and token-limit error handling already shared by every other AI call. Alternative rejected: reusing `evaluateTranslationStory`, whose request shape and grading rules are round-specific.

### 4. A parser that mirrors the surviving vault-shape rules

`prompts.parseExtractedConstruction(text)` reuses `extractJsonObject`, validates `category` and `spoken_frequency` against the same allow-lists used elsewhere in `prompts.js` (falling back to a default when the model omits or invents a value), requires a non-empty `construction`, forces `original` to an empty string, and returns `{ success, construction, warnings, error }` — the same result contract as the parsers it sits beside, which keeps the component's error path uniform with the rest of the codebase.

### 5. Harvesting writes straight to the vault

The Add action calls `addImprovements(sessionId, [item])` with the session already in hand, which creates the SRS card and makes the item appear in Library under that session. Nothing is mirrored into `session.messages`. Alternatives rejected: staging harvested items in a session tray confirmed at Finish (new state in two components, and a second confirmation for a single item), and routing them through the Step-4 picker (that picker is now the prompt path's, and mixing instant and batch writes would split one vault shape across two flows). Consequence accepted: the session flips to `status: 'imported'` after the first harvest; nothing reads that field for UI today. Because the vault carries the session link, `TranslationStoryViewerModal` simply loses its now-empty constructions block.

### 6. Duplicate detection on the construction, not the original

Before offering the Add action, the component compares the extracted construction against the vault's constructions, case-insensitively and trimmed. A match reports that it is already saved and the Add action writes nothing. This also forces a fix in `store.js`: `findDuplicate` currently dereferences `i.original.toLowerCase()` for every stored improvement, so the first improvement with an empty `original` would make it throw; it becomes null-safe and matches on the construction, which is the field a harvested item always has.

### 7. Empty `original` is a first-class value

Harvested improvements have no learner error behind them, so `original` is empty by design. The three unguarded renders (`Library.jsx:367`, `Review.jsx:262`, `Session.jsx:781`) hide their line when it is empty; `Practice.jsx:323` already guards. `buildAnnotatedText` already skips improvements without an `original`, so the interactive text viewer is unaffected.

### 8. The AI paths into Step 4 are deleted, not gated

Deliberate removals, in dependency order: `generateStoryFeedbackPrompt` loses its constructions section while `parseStoryFeedback` and `STORY_ROUND_CONSTRUCTION_CAP` lose their construction handling; `StoryFeedbackCard` drops its list; `aggregateStoryConstructions` and the story branch of `handleTranslationFinish` collapse to "save the session, return to the Dashboard"; `generateSeamlessSessionFeedback`, `handleSeamlessFinish`, and the Step-3 analysis screen are deleted, with `SeamlessChatSession` finishing by saving text, duration, and activity. Step 4 stays reachable only through `handleImport` (pasted prompt JSON). Rationale: leaving the old paths behind a flag would keep two contradictory construction sources and their dead specs alive; keeping the sweep as an optional extra was explicitly rejected.

### 9. Testing strategy

New coverage: a component test for `ConstructionExtractor` that seeds a `Range` inside the block, dispatches `mouseup`, asserts the request shape, and drives preview → Add (vault and SRS card written), duplicate (no write), unparsable (raw text plus retry), and no-key (control absent). `prompts.test.js` gains parser cases for valid, invalid, and missing-field responses. `aiService.test.js` gains request assertions for the extraction endpoint, model, temperature, and the short-pattern instruction. Existing suites are updated rather than dropped wholesale: `TranslationStorySession.test.jsx` loses its aggregation cases and asserts the feedback card shows no construction list; `Session.test.jsx` keeps the prompt-mode picker cases and replaces the story-aggregation cases with one asserting that Finish returns to the Dashboard with no import step.

## Risks / Trade-offs

- [Clicking the trigger clears the browser selection] → capture the selection on `mouseup`/`keyup` inside the block and `preventDefault()` on the trigger's mousedown, so the request never depends on the live selection at click time.
- [A streaming coach reply invalidates a selection mid-stream] → capture only from settled blocks; the control is disabled while that message is still being written.
- [Selections spanning two blocks] → the containment check rejects them, leaving the control disabled instead of guessing a source block.
- [An empty `original` degrades existing screens] → guarded renders plus the null-safe store helper; the annotated viewer already ignores items without `original`.
- [Free Dialogue loses its error-correction sweep] → accepted: the coach's replies are the harvesting source there, and the Prompt Copy/Paste path still imports reviewed batches for anyone who wants them.
- [Extraction costs one small completion per click] → user-initiated only, `maxTokens: 1000`, and the pending state blocks a second request for the same block.
- [Fewer automatic suggestions after finishing a story] → the improved version stays as the material to harvest from, which is the trade the learner explicitly chose.

## Migration Plan

- No data migration. Stored rounds keep whatever `constructions` they already hold (only rendering changes); vault items written before this change keep their `original`; harvested items intentionally have none, and the UI tolerates it.
- Client-only change, so rollback is a code revert: previously harvested items remain valid vault improvements with their SRS cards.
- Suggested implementation order: prompt builder and parser, then the extraction request, then the store fix, then the component, then wiring into both screens, then the deletions, then the test updates, with the spec sync happening at archive time.

## Open Questions

- Whether the story replay modal should later list a session's harvested constructions itself, rather than leaving them to the Library's session filter. Deferrable: no requirement or task depends on it.

