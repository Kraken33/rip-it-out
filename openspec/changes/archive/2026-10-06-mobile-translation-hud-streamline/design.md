# Design

## Context

Both `TranslationPracticeSession.jsx` and `TranslationStorySession.jsx` currently render a persistent top header bar containing round indices, practiced counters, and finish/exit buttons. In addition, their bottom composers render an inline toolbar with an Actions drawer toggle, a microphone dictation button, and a Translate button.

On mobile viewports with soft keyboards opened, this creates vertical crowding. By hiding the top bar on `< sm` viewports and moving all actionable controls into the floating Actions HUD drawer, we eliminate unnecessary vertical bulk while preserving a clean, accessible interaction model.

## Goals / Non-Goals

**Goals:**
- Hide the top header bar on mobile devices (`< 640px` / `< sm`) across both `TranslationPracticeSession.jsx` and `TranslationStorySession.jsx`.
- Preserve the top header bar for desktop viewports (`sm:flex` / `>= 640px`).
- Move the `Translate` submit action and the `AudioRecorder` dictation trigger inside the mobile Actions HUD.
- Display current round status and practiced counts / vibe tags inside the mobile Actions HUD header and on the `⚡ Actions` pill.
- Ensure tapping `Translate` from within the Actions HUD submits the translation and closes the HUD seamlessly.

**Non-Goals:**
- Changing desktop layout, desktop keyboard shortcuts, or desktop toolbar controls.
- Modifying the AI prompt evaluation flows, SRS rating logic, or backend storage models.

## Decisions

### 1. Header Visibility via Tailwind Breakpoint Classes
* **Decision**: Set the top session header's container to `hidden sm:flex` (instead of `flex`).
* **Rationale**: Zero JavaScript layout calculation overhead; clean CSS responsive hiding that preserves desktop layout untouched.

### 2. Dock Simplification on Mobile
* **Decision**: In the bottom composer dock, wrap the inline `AudioRecorder` and `Translate ▶` button with `hidden sm:flex` / `hidden sm:inline-flex`.
* **Rationale**: Leaves only the full-width translation textarea and the `⚡ Actions (Round N)` button on mobile, maximizing typing visibility and avoiding UI crowding.

### 3. Comprehensive Actions HUD on Mobile
* **Decision**: Structure the mobile Actions HUD (`data-testid="mobile-practice-actions-panel"` and `data-testid="mobile-actions-panel"`) with:
  1. **Header**: `Round N` + `practiced / vibe badge` + `✕ Close` button.
  2. **Primary Input Actions**:
     - `AudioRecorder` (centered dictation box).
     - Full-width `Translate Translation ▶` button (enabled when `inputText` is non-empty, triggers submit and closes HUD).
  3. **Secondary Session Actions**:
     - `✨ Tune Story Flavor` (in `TranslationStorySession`).
     - `➡️ Next Round` button.
     - `✓ Finish Practice & Rate Recall` / `✓ Finish Story` button.
     - `Exit to Practice Modes` button (if `onExit` provided).
* **Rationale**: Gives mobile users a single, thumb-accessible control center for all session navigation and input triggers.

## Risks / Trade-offs

* **[Risk] Mobile translation submit requires two taps (Actions -> Translate)**
  * *Mitigation*: The `⚡ Actions (Round N)` toggle is anchored right under the textarea. When translation is ready, tapping Actions pops up the high-contrast `Translate Translation ▶` button at the top of the HUD. Also, `Ctrl/Cmd + Enter` continues to submit directly on mobile devices using external keyboards.
* **[Risk] Test breakage due to changed DOM element visibility or queries**
  * *Mitigation*: Ensure unit tests query buttons by role/name or test-ids and account for both desktop and mobile HUD structures.
