# Proposal

## Why

Currently, the three interactive AI practice sessions in the app—"Free Dialogue" (`SeamlessChatSession`), "Story Translation" (`TranslationStorySession`), and "Russian Translation Practice" (`TranslationPracticeSession`)—have drifted in implementation and UX. 

While Story Translation and Russian Practice share a unified mobile-first architecture (fullscreen app wrapper, body scroll lock, responsive `hidden sm:flex` header, collapsible `⚡ Actions` HUD, full-width docked composer, and caret-aware dictation), Free Dialogue remains trapped in an older layout: it is cramped under the wizard setup header and progress stepper, lacks a mobile actions HUD, stacks the microphone above a narrowed textarea, appends dictation instead of inserting at the caret, and does not lock body scrolling on mobile.

Creating a shared `InteractiveSessionShell` component unifies all three interfaces around the same polished, keyboard-attached interaction model, removes ~400 lines of duplicated layout/footer/dock logic, and brings Free Dialogue up to the first-class standard of Story Translation and Russian Practice.

## What Changes

- **Create `InteractiveSessionShell` component (`src/components/InteractiveSessionShell.jsx`)**:
  - Provides the outer responsive frame (desktop `max-w-4xl sm:h-[88vh]` glass panel, mobile `100dvh` fixed full-viewport with `useVisualViewport` integration and locked body scroll).
  - Provides a consolidated desktop header (`hidden sm:flex`) with title, badges, and action slots.
  - Houses the scrollable feed container with auto-scroll management (`scrollToBottom` on new content or keyboard open).
  - Implements the collapsible mobile `⚡ Actions` HUD with dictation slot and action buttons.
  - Implements the docked footer with keyboard shortcut hint (`Ctrl/⌘ + Enter`), full-width auto-expanding textarea, mobile `⚡ Actions` toggle, desktop inline audio recorder, and primary submit action.
  - Standardizes caret-aware transcription insertion (`insertTranscription`) for both desktop and mobile dictation.
  - Supports optional intermediate drawers (e.g. Story Flavor matrix drawer) and error banner with retry.
- **Refactor `SeamlessChatSession.jsx`**:
  - Migrate to `InteractiveSessionShell`.
  - Replace the stacked mic row and side-by-side Send button with the docked footer and mobile `⚡ Actions` HUD (`AudioRecorder` + `Finish Conversation →`).
  - Support caret-aware transcription insertion.
- **Update `Session.jsx`**:
  - Treat Free Dialogue in Step 2 (`activity === 'dialogue' && mode === 'seamless'`) as an immersive interactive session: hide the wizard header and progress stepper during the active conversation, matching Story Translation.
  - Apply the full-screen viewport wrapper and `lockBodyScroll: true` for both seamless dialogue and story translation in Step 2.
- **Refactor `TranslationStorySession.jsx` & `TranslationPracticeSession.jsx`**:
  - Migrate to `InteractiveSessionShell`, replacing their duplicated footer docks, mobile action HUDs, auto-grow textareas, and viewport handlers.
  - Maintain all existing data attributes, test IDs, and feature behaviors.

## Capabilities

### Modified Capabilities
- `ai-seamless-integration`: Expand the interaction and viewport requirements for seamless chat sessions to include full-screen immersive takeover, mobile visual viewport docking, collapsible mobile actions HUD, and caret-aware speech transcription insertion.

## Impact

- **Components**:
  - New: `src/components/InteractiveSessionShell.jsx`
  - Modified: `src/screens/SeamlessChatSession.jsx`, `src/screens/TranslationStorySession.jsx`, `src/screens/TranslationPracticeSession.jsx`, `src/screens/Session.jsx`
- **Testing**:
  - `src/__tests__/SeamlessChatSession.test.jsx`, `src/__tests__/Session.test.jsx`, `src/__tests__/TranslationStorySession.test.jsx`, `src/__tests__/TranslationPracticeSession.test.jsx` will be updated to verify the unified shell layout and preserved test IDs.
- **Dependencies & APIs**:
  - No new external libraries or backend changes; pure React/Tailwind/CSS refactoring leveraging existing `useVisualViewport` and `AudioRecorder`.
