# Design

## Context

See `proposal.md` for the motivation. The application currently implements three interactive AI practice experiences:
1. `SeamlessChatSession.jsx` (Free Dialogue conversation coach)
2. `TranslationStorySession.jsx` (Russian story round translation)
3. `TranslationPracticeSession.jsx` (Targeted Russian SRS translation drills)

Story Translation and Russian Practice were recently rewritten with a mobile-first viewport architecture (`useVisualViewport`, locked body scroll, 16px minimum font to prevent iOS zoom, top desktop header `hidden sm:flex`, collapsible mobile `⚡ Actions` HUD, full-width docked composer, and caret-aware dictation). Free Dialogue, however, remained on an older layout with stacked dictation, narrow side-by-side inputs, and no mobile actions panel, embedded inside the multi-step setup wizard in `Session.jsx`.

## Goals / Non-Goals

**Goals:**
- Extract a reusable, composable `InteractiveSessionShell.jsx` component that encapsulates:
  - Responsive viewport frame (`100dvh` fixed on mobile, `88vh max-w-4xl` on desktop).
  - Consolidated desktop header (`hidden sm:flex`).
  - Scrollable feed container with auto-scroll management (`scrollToBottom`).
  - Collapsible mobile `⚡ Actions` HUD with dictation and action button slots.
  - Docked footer with auto-expanding textarea, keyboard shortcut hints, inline desktop audio recorder, and primary submit action.
  - Caret-aware voice transcription insertion.
  - Optional drawer slot (for Story Flavor matrix) and error banner slot with retry.
- Migrate `SeamlessChatSession.jsx` to use `InteractiveSessionShell.jsx`.
- Refactor `TranslationStorySession.jsx` and `TranslationPracticeSession.jsx` to delegate layout and interaction to `InteractiveSessionShell.jsx`.
- Update `Session.jsx` so Step 2 seamless dialogue provides the same fullscreen immersive experience as story translation.
- Preserve all existing tests, test IDs, and user workflows.

**Non-Goals:**
- Merging the business logic or state machines of the three sessions into a single monolithic controller. Each session retains its domain-specific lifecycle (streaming completion vs. story generation vs. SRS card queues).
- Modifying prompt copy/paste flows or backend schemas.

## Decisions

### 1. Slot/Composition Pattern vs. Monolithic Component
**Decision:** Implement `InteractiveSessionShell` as a layout and interaction shell using React props and children slots, rather than combining all three sessions into a single multi-mode component.

- **Rationale:** The three activities have completely distinct data models and lifecycle flows:
  - Free Dialogue is an open-ended conversational stream updating session messages.
  - Story Translation samples a 4D variety matrix, rerolls passages, and parses multi-round evaluation objects.
  - Russian Practice rotates through SRS cards, tracks coverage quality (natural/awkward/missing), and transitions to recall rating.
  A monolithic component would exceed 1,200 lines and become brittle. A compound shell extracts ~400 lines of duplicated UI layout, viewport, and footer code while keeping domain logic clean and decoupled.
- **Alternatives Considered:** A single `PracticeSession` with `mode="chat" | "story" | "practice"`. Rejected due to excessive cyclomatic complexity and risk of cross-mode regression.

### 2. Component API & Slots for `InteractiveSessionShell`

The shell component will accept:
```jsx
<InteractiveSessionShell
  // Viewport & Scroll
  messagesEndRef={messagesEndRef}
  onKeyboardOpen={scrollToLatest}
  
  // Header Slots
  headerLeft={<SessionBadgesAndTitle />}
  headerRight={<DesktopActionButtons />}
  
  // Mobile Actions HUD Slots
  mobileRoundLabel="R1"
  mobileActionsTitle="Session Actions"
  mobileActionsTestId="mobile-actions-panel"
  renderMobileActions={({ closeMenu }) => (
    <>
      <AudioRecorder ... onTranscribed={(t) => { insertTranscription(t); closeMenu(); }} />
      <button onClick={() => { handleSubmit(); closeMenu(); }}>Send</button>
      <button onClick={() => { handleFinish(); closeMenu(); }}>Finish</button>
    </>
  )}
  
  // Extra Drawer & Error Banner
  drawer={matrixOpen && <VarietyMatrixDrawer />}
  errorMsg={errorMsg}
  renderErrorAction={canRetry && <button onClick={handleRetry}>Retry</button>}
  
  // Docked Footer Composer
  inputRef={inputRef}
  inputText={inputText}
  onInputChange={setInputText}
  onSubmit={handleSubmit}
  canSubmit={canSubmit}
  submitLabel="Send ▶" // or "Translate ▶"
  submitButtonId="btn-submit"
  inputPlaceholder="Speak above or type your answer..."
  inputDisabled={loading}
  shortcutHint="Enter adds a new line · Ctrl/⌘ + Enter sends"
  
  // Dictation
  settings={settings}
  onTranscribed={insertTranscription}
  onAudioError={(err) => setErrorMsg(err)}
>
  {/* Feed Content */}
  {messages.map(...)}
</InteractiveSessionShell>
```

### 3. Caret-Aware Audio Insertion Helper
**Decision:** Standardize transcription insertion using a shared caret-aware utility `insertTranscriptionAtCaret`:
```javascript
export function insertTranscriptionAtCaret(inputEl, prevText, transcription) {
  if (!transcription) return prevText;
  const start = typeof inputEl?.selectionStart === 'number' ? inputEl.selectionStart : prevText.length;
  const end = typeof inputEl?.selectionEnd === 'number' ? inputEl.selectionEnd : start;
  const before = prevText.slice(0, start);
  const after = prevText.slice(end);
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  const trail = after && !/^\s/.test(after) ? ' ' : '';
  return `${before}${lead}${transcription}${trail}${after}`;
}
```
This is exported from `InteractiveSessionShell` (or a helper utility) and used across all three sessions.

### 4. Fullscreen Immersion in `Session.jsx`
**Decision:** In `Session.jsx`, expand the active fullscreen condition:
```javascript
const isInteractiveActive = step === 2 && (activity === 'translation' || (activity === 'dialogue' && mode === 'seamless'));
```
When `isInteractiveActive` is true:
- The top "New Practice Session" heading and ModeToggle are suppressed.
- The 4-step progress indicator is suppressed.
- The container takes over full viewport with `lockBodyScroll: true`, matching the experience of `TranslationPracticeSession` and `TranslationStorySession`.

## Risks / Trade-offs

- **[Risk] Test ID and Selector regressions in existing test suites** → **Mitigation:**
  Keep all existing data-testids (`mobile-actions-panel`, `mobile-practice-actions-panel`, `toggle-mobile-actions`, `toggle-mobile-practice-actions`, `btn-finish-seamless-session`, etc.) configurable or mapped through shell props so existing tests in `SeamlessChatSession.test.jsx`, `TranslationStorySession.test.jsx`, and `TranslationPracticeSession.test.jsx` continue to pass without structural breakages.

- **[Risk] Viewport height jumps on mobile browsers** → **Mitigation:**
  Reuse `useVisualViewport` with `scrollToElementBottom`, exact height inline styling when `viewportWidth < 640`, and 16px minimum text size on inputs to avoid iOS browser zoom.
