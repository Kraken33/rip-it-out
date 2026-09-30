# Design

## Context

The backend prompt builders and API call (`extractConstruction`, `generateConstructionExtractionPrompt`, `parseExtractedConstruction`) are implemented in `prompts.js` and `aiService.js`. The missing piece is the user-facing extraction trigger, selection listener, preview modal/card, and vault integration in `TranslationStorySession.jsx` and `SeamlessChatSession.jsx`.

## Goals / Non-Goals

**Goals:**
- Provide a clean, robust, and intuitive selection UX where selecting text in a story passage or coach feedback reveals an action button to extract the phrase/construction.
- Show an interactive preview card beneath the block where the phrase was extracted with full category, spoken frequency, explanation, and an Add/Discard action.
- Ensure duplicates are detected and flagged if the phrase already exists in the vault.
- Add extracted constructions straight into the vault and SRS flashcard queue upon clicking "Add to Study List".

**Non-Goals:**
- Batch whole-session automatic extraction.
- Modifying prompt copy-paste mode.

## Decisions

### 1. Reusable `ConstructionExtractor` Component
- **Decision**: Encapsulate selection listening, trigger rendering, OpenAI extraction dispatch, preview UI, and store saving in a dedicated `ConstructionExtractor` component.
- **Rationale**: Keeps `TranslationStorySession` and `SeamlessChatSession` clean and modular. Prevents selection event handling bugs from leaking across components.

### 2. Selection Event Handling & Focus Retention
- **Decision**: Listen to `mouseup` and `keyup` on the container DOM element. Check `window.getSelection()` containment within `containerRef`. Use `onMouseDown={(e) => e.preventDefault()}` on action buttons so clicking the extract button does not collapse the selection before extraction begins.
- **Alternatives considered**: Floating popover positioned at selection rect coordinates vs inline action bar. Inline / contextual action bar below the passage/text block provides cleaner mobile/responsive UX and does not obscure the text being selected.

### 3. Duplicate Prevention & Vault Persistence
- **Decision**: Check `store.getImprovements()` for matching constructions (normalized lowercase). If matched, display "Already in study list" state and disable adding duplicate cards.
- **Rationale**: Avoids polluting the learner's SRS queue with identical flashcards.

## Risks / Trade-offs

- *[Risk: Selection loss on touch devices or click outside]* → Mitigate by storing the selected text in local component state as soon as selection changes, and preventing button focus loss with `preventDefault`.
- *[Risk: Multiple simultaneous extractions]* → Mitigate by setting a loading state (`isExtracting`) that disables concurrent extraction requests.
