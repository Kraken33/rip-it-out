# Design: Mobile Translation Keyboard-Aware Split Viewport

## Context

See [proposal.md](proposal.md) for background and motivation.

When users focus text inputs on mobile devices (especially iOS Safari and Chrome Mobile), the virtual keyboard occupies 40–50% of the screen. In addition, the browser's default focus behavior attempts to scroll `window.scrollY` towards the focused input element at the bottom of the document. If reactive scroll-back corrections are delayed with timeouts or smooth-scrolling animations, the user experiences slow, sluggish transitions where the screen slowly jerks back to the top. Furthermore, placing action buttons on the same horizontal row as the textarea squeezed the text box to ~1/3 of the screen width.

## Goals / Non-Goals

**Goals:**
- Provide real-time synchronization between the active translation container and `window.visualViewport.height`.
- Preemptively lock `document.body` and `document.documentElement` scrolling during active mobile translation sessions so the window cannot scroll in the first place.
- Use `preventScroll: true` and instant scroll reset (`window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`) on textarea focus and viewport resize, eliminating sluggish scroll-back delays.
- Provide a full-width translation textarea (100% width) on mobile viewports so typing is spacious and comfortable.
- Hide auxiliary buttons (*Audio Dictate*, *Tune Flavor*, *Reroll Story*, *Finish Session*) under a collapsible menu/toggle drawer (`Actions ▾` or compact icon toggle) on mobile.
- Ensure the active Russian story passage remains persistently visible and readable in the upper viewport while the user is typing in the English translation textarea.
- Provide a consistent, resilient implementation across both `TranslationStorySession` and `TranslationPracticeSession`.

**Non-Goals:**
- Modifying the AI prompt orchestration or LLM response schemas.
- Changing desktop / tablet widescreen layout where horizontal and vertical real estate is abundant.
- Altering the SRS card rating logic or session persistence formats.

## Decisions

### Decision 1: Preemptive Document Body Lock & Instant Focus Scroll Suppression
- **Choice**: Implement `useVisualViewport.js` with preemptive body scroll locking (`overflow: hidden; position: fixed; width: 100%`) when mounted on mobile, paired with instant focus scroll suppression (`preventScroll: true` and `behavior: 'instant'`).
- **Details**:
  - Sets `overflow: hidden; position: fixed; width: 100%; top: 0; left: 0;` on the document body during active translation sessions, preventing the browser from initiating native window scroll animations.
  - On textarea focus, triggers immediate `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` without delayed `setTimeout` polling, ensuring an instantaneous, rock-solid layout.
  - Gracefully restores document body styling on session unmount.
- **Alternatives Considered**:
  - *Delayed `setTimeout` scroll-back*: Caused noticeable 100ms+ lag and sluggish visual jumping.
  - *`scroll-behavior: smooth`*: Fought against browser keyboard animation and caused slow jerking.

### Decision 2: Full-Width Textarea with Collapsible Auxiliary Controls
- **Choice**: Separate the translation composer into a full-width textarea (occupying 100% of the horizontal space) and place auxiliary buttons inside a collapsible action drawer/toggle.
- **Details**:
  - Main composer row: A full-width auto-expanding textarea (with 16px `text-base` font size to prevent iOS zoom) with an inline/adjacent primary Translate submit button or streamlined submit bar.
  - Collapsible actions bar: Auxiliary controls (`🎙️ Dictate`, `✨ Flavor`, `🎲 Reroll`, `✕ Finish`) are placed in a collapsible menu/drawer that toggles open/closed without horizontally constraining the textarea.
  - Desktop layout retains the roomier multi-line textarea and permanent horizontal action bar.
- **Alternatives Considered**:
  - *Single horizontal row for all buttons and textarea*: Left barely 1/3 width for the textarea on narrow mobile viewports (<390px).

### Decision 3: Pinned Split View during Active Translation
- **Choice**: During the translation phase (`!currentRound.translation` / active round), structure the mobile view into two distinct zones:
  - Upper zone: The active Russian passage card with internal scrolling (`overflow-y-auto`) if long.
  - Lower zone: The full-width composer dock locked directly above the keyboard.
- **Details**:
  - After submission and when feedback is displayed, the view expands to show the feedback card and Next Round action.

## Risks / Trade-offs

- **[Risk] Body Scroll Lock Cleanup on Navigation** → *Mitigation*: Ensure `useEffect` cleanup handlers in `useVisualViewport` and session wrappers strictly restore previous `document.body.style` properties when navigating away.
- **[Risk] Test Environment Compatibility (happy-dom)** → *Mitigation*: Guard `window.visualViewport` and `window.scrollTo` calls with safe fallback checks, allowing Vitest unit tests to execute cleanly.
