# Proposal

## Why

Rip It Out originally supported a dual-mode workflow: users without API keys could copy handcrafted prompts (Prompts #1–#5) into external LLMs (ChatGPT, Claude) and paste back conversations or JSON outputs, while users with OpenAI API keys could use automated "Seamless AI" sessions. 

The manual prompt workflows add substantial UI complexity (mode toggles, 4-step wizard with prompt copy/paste boxes, raw JSON import parsers, external LLM practice tabs, and Prompt #4 copy buttons in reviews), dilute the core user experience, and have become redundant now that in-app Seamless AI (voice coaching, story translation, card-style Russian practice, frequency drills, and construction harvesting) is the primary interactive way to learn. Removing all manual prompt interfaces streamlines the UX so every session is a direct, zero-friction interactive AI experience.

## What Changes

- **BREAKING** Remove dual-mode navigation (`ModeToggle`) across session creation, practice, and settings.
- **BREAKING** Remove the manual Prompt Copy/Paste flow in `Session.jsx` (Step 2 Prompt #1 copy/paste, Step 3 Prompt #2 export prompt and JSON import textarea, and Step 4 selective import review). Dialogue sessions now transition immediately into interactive `SeamlessChatSession`.
- **BREAKING** Remove external LLM prompt tabs and copy interfaces from `Practice.jsx` (Scenario Q&A / Prompt #3 copy screen, and Translation Practice Prompt #5 copy screen). Practice mode now directly launches the card-style interactive `TranslationPracticeSession` (or links to Frequency Sentence Practice).
- **BREAKING** Remove the "✨ Get Example Sentences (Prompt #4)" accordion and copy button from flashcard `Review.jsx`.
- **BREAKING** Remove the "Default Session Interaction Mode" setting in `Settings.jsx` and related `defaultMode` state in `store.js`.
- Remove "🤖 Practice with External LLM (Prompt #3)" button and prompt-centric subheadings on `Dashboard.jsx`, routing practice directly to interactive practice.
- Retain `PromptConversationViewerModal` only for backward-compatible read-only viewing of historical sessions already saved in vault history.
- Deprecate/remove public prompt generation functions (`generateDescriptionPrompt`, `generateExportPrompt`, `generatePracticePrompt`, `generateTranslationPracticePrompt`, `generateExamplesPrompt`, `parseImportJSON`) from user-facing surfaces.

## Capabilities

### Modified Capabilities
- `ai-seamless-integration`: Update Requirement 2 to enforce Seamless AI as the exclusive, standard interaction mode; eliminate the mode switcher and prompt copy/paste dual-mode branching.
- `session-flow`: Update session flow to remove the Prompt Copy/Paste dialogue branch and the Review & Confirm JSON import step; dialogue activity starts interactive chat directly.
- `russian-practice`: Remove Prompt #3 (Scenario Questions) and Prompt #5 (Multi-Round Translation) copy/paste requirements and external rating screen; preserve exclusively the card-style Seamless AI Translation Practice.
- `prompt-orchestrator`: Deprecate and remove external LLM prompt generation (Prompts #1-#5) and raw JSON import parsing from user interfaces.

## Impact

- **UI / Screens**:
  - `src/components/ModeToggle.jsx`: Removed or deprecated.
  - `src/screens/Session.jsx`: Simplified to remove Steps 2–4 prompt copy/paste, JSON parsing, and import confirmation wizard.
  - `src/screens/Practice.jsx`: Simplified to remove Prompt #3, Prompt #5, and mode sub-selectors; focuses strictly on interactive translation practice.
  - `src/screens/Review.jsx`: Prompt #4 examples section removed from the revealed card back.
  - `src/screens/Settings.jsx`: Removed interaction mode pill group.
  - `src/screens/Dashboard.jsx`: Updated action buttons and copy.
- **State & Storage**:
  - `src/store.js`: Deprecate `defaultMode` setting field.
- **Tests**:
  - Update `src/__tests__/Session.test.jsx`, `src/__tests__/Practice.test.jsx`, `src/__tests__/Settings.test.jsx`, `src/__tests__/ModeToggle.test.jsx`, `src/__tests__/Review.test.jsx`, `src/__tests__/prompts.test.js`, and `src/__tests__/Dashboard.test.jsx`.
