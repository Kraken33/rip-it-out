# Proposal

## Why

On the New Practice Session screen (`/session/new`), users trying to set up a new practice session (specifically Free Dialogue or Story Translation configuration) cannot scroll down to fill out the form or tap the "Start" button because any window scroll event immediately snaps the viewport back to the top (`0, 0`). This occurs because `useVisualViewport` attaches an unconditional `window` scroll listener that resets `window.scrollTo({ top: 0, left: 0 })` on every scroll event regardless of whether body scroll lock is active.

## What Changes

- Scope the viewport scroll suppression in `useVisualViewport` strictly to instances where `lockBodyScroll` is explicitly `true`.
- Avoid attaching the window scroll listener when `lockBodyScroll` is `false`, ensuring standard page scrolling works across form steps, dialogue setups, import reviews, and normal document flows.
- Ensure `handleResize` and `handleWindowScroll` only enforce `window.scrollTo(0, 0)` when `lockBodyScroll` is active and software keyboard resize is detected.
- Refine `Practice.jsx` so `lockBodyScroll` is only enabled when the interactive seamless translation session is mounted and active, rather than during initial data loading or post-practice card rating.
- Add unit tests verifying that window scroll events do not reset scroll positions when `lockBodyScroll` is disabled.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `translation-story-session`: Clarify mobile viewport scroll lock requirement so that body scroll locking and window scroll suppression apply strictly during active full-screen translation sessions, and never intercept standard document scrolling on setup or review interfaces.

## Impact

- `src/hooks/useVisualViewport.js`: Window scroll listener and resize handlers conditioned on `lockBodyScroll`.
- `src/screens/Session.jsx`: Verifies standard scroll behavior on Step 1, Step 3, and Step 4.
- `src/screens/Practice.jsx`: Tightens `isTranslationActive` so scroll lock only applies when `TranslationPracticeSession` is actively running.
- `src/__tests__/useVisualViewport.test.jsx`: New test cases covering scroll behavior when `lockBodyScroll` is false vs true.
