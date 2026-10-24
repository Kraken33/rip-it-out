# Design

## Context

Rip It Out was created as a prompt orchestrator for external LLMs (generating Prompts #1 through #5 for copy/pasting into ChatGPT/Claude and parsing pasted JSON). Later changes introduced Seamless AI capabilities powered by direct OpenAI and Groq APIs:
- Interactive voice coaching (`SeamlessChatSession`)
- AI Story Translation rounds (`TranslationStorySession`)
- Card-style single-sentence Russian translation practice (`TranslationPracticeSession`)
- Frequency Sentence Practice mini-drills (`FrequencyPracticeSession`)
- In-text construction harvesting (`ConstructionExtractor`)

The coexistence of manual prompt copy/paste flows alongside automated seamless features resulted in dual-mode switches (`ModeToggle`), redundant wizard steps in `Session.jsx`, prompt copy textareas in `Practice.jsx`, and Prompt #4 copy blocks in `Review.jsx`.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Make Seamless AI the single, standard interaction mode across the entire application.
- Remove all manual prompt generation, copy/paste textareas, and JSON import wizard steps from user-facing screens (`Session.jsx`, `Practice.jsx`, `Review.jsx`, `Settings.jsx`, `Dashboard.jsx`).
- Clean up obsolete UI components (`ModeToggle.jsx`) and retired prompt generation exports (`generateDescriptionPrompt`, `generateExportPrompt`, `generatePracticePrompt`, `generateTranslationPracticePrompt`, `generateExamplesPrompt`, `parseImportJSON`).
- Preserve backward compatibility for historical session viewing in the Library (`PromptConversationViewerModal.jsx`).
- Ensure all automated AI features (free dialogue chat, story translation, card-style translation practice, frequency drills, construction extraction) work flawlessly without prompt mode references.

**Non-Goals:**
- Removing internal prompts and system messages used by `aiService.js` to communicate with the OpenAI API (e.g., chat coaching system prompts, story generation prompts, translation evaluation prompts, construction extraction prompts).
- Altering the SRS scheduling engine (`srs.js`), vault data store schema (`store.js`), or authentication flows.
- Deleting historical prompt session records from existing user databases.

## Decisions

### 1. Remove `ModeToggle` and obsolete prompt wizard steps in `Session.jsx`
- **Decision**: In `Session.jsx`, remove `ModeToggle`. When the user submits Step 1 with `activity === 'dialogue'`, transition directly to `SeamlessChatSession` in Step 2. Delete Step 2 prompt copy/paste, Step 3 Prompt #2 export, and Step 4 selective import UI.
- **Rationale**: The manual prompt wizard in `Session.jsx` accounts for ~400 lines of complex clipboard copying, textarea JSON pasting, and import validation code. Removing it makes `Session.jsx` a streamlined launcher for either `SeamlessChatSession` or `TranslationStorySession`.
- **Alternatives Considered**: Keeping a collapsed "Advanced: Copy prompt instead" accordion. Rejected because the explicit goal is to eliminate all manual prompt interfaces and keep only seamless AI.

### 2. Streamline `Practice.jsx` to interactive translation practice only
- **Decision**: Remove the `practiceType === 'scenario'` tab (Prompt #3) and `translationSubMode === 'prompt'` (Prompt #5). `Practice.jsx` will directly mount `TranslationPracticeSession` (or show empty/due state) with a clean link to Frequency Sentences. When exiting `TranslationPracticeSession`, navigate back to `/dashboard` instead of falling back to a prompt copy screen.
- **Rationale**: Scenario Q&A and Prompt #5 were external LLM workarounds before `TranslationPracticeSession` existed. The in-app card session is strictly superior, evaluates grammar, and rates SRS cards inline.
- **Alternatives Considered**: Renaming Scenario Q&A to an AI chat mode. Rejected because Free Dialogue (`SeamlessChatSession`) already handles open-ended conversational coaching.

### 3. Remove Prompt #4 from Flashcard `Review.jsx`
- **Decision**: Remove the "✨ Get Example Sentences (Prompt #4)" toggle button, copy handler, and code block on the revealed card back.
- **Rationale**: Flashcards already display the target construction, natural improved example sentence, explanation, audio playback, and SRS rating buttons. Prompt #4 was a legacy copy button for external ChatGPT prompts.

### 4. Remove `defaultMode` from `Settings.jsx` and `store.js`
- **Decision**: Remove the "Default Session Interaction Mode" toggle from `Settings.jsx`. Deprecate or remove `defaultMode` in `store.js` (treating it as an ignored legacy field if present in existing records).
- **Rationale**: Settings should not ask users to choose between seamless AI and a removed mode.

### 5. Keep `PromptConversationViewerModal.jsx` for historical sessions
- **Decision**: Maintain `PromptConversationViewerModal` in `ConversationViewerModal.jsx` so existing sessions created in prompt mode during earlier versions of the app remain readable in the Library.
- **Rationale**: Library browsing should never crash when viewing older historical sessions.

### 6. Clean up `src/prompts.js` and public exports
- **Decision**: Remove external LLM prompt generator functions (`generateDescriptionPrompt`, `generateExportPrompt`, `generatePracticePrompt`, `generateTranslationPracticePrompt`, `generateExamplesPrompt`, `parseImportJSON`). Keep internal parser utilities (`parseExtractedConstruction`, `parseStoryFeedback`, `parseTranslationVerdict`, `VARIETY_MATRIX`, `VARIETY_PRESETS`) used by `aiService.js` and sessions.
- **Rationale**: Dead code elimination avoids developer confusion and simplifies test maintenance.

## Risks / Trade-offs

- **[Risk] Users without OpenAI API keys cannot run sessions**:
  - *Mitigation*: Seamless sessions already display clear inline guidance directing the user to enter an OpenAI API key in Settings. The app no longer pretends to be a prompt-copying utility.
- **[Risk] Existing tests expecting prompt buttons fail**:
  - *Mitigation*: Update test suites (`Session.test.jsx`, `Practice.test.jsx`, `Settings.test.jsx`, `Review.test.jsx`, `prompts.test.js`, `Dashboard.test.jsx`) to assert seamless interaction behavior instead of prompt copy/paste controls.
- **[Risk] Historical sessions rendered incorrectly**:
  - *Mitigation*: Keep `PromptConversationViewerModal` intact as the viewer fallback for sessions with no chat messages.
