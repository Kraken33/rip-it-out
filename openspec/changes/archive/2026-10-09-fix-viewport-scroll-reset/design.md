# Design

## Context

`useVisualViewport` tracks `window.visualViewport` dimensions and provides mobile keyboard detection and body scroll locking. In commit `c88c3cbe`, a window scroll listener (`handleWindowScroll`) was introduced to suppress unwanted window auto-scrolling when mobile Safari opens the virtual keyboard.

However, `window.addEventListener('scroll', handleWindowScroll)` was attached unconditionally, executing `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` on any scroll event even when `lockBodyScroll` was `false`. As a result, standard scrollable pages that mount `useVisualViewport` (such as `Session.jsx` Step 1 Details) throw the user back to the top whenever they attempt to scroll down.

## Goals / Non-Goals

**Goals:**
- Restrict window scroll event suppression strictly to when `lockBodyScroll` is `true`.
- Ensure standard documents and forms (e.g. New Practice Session Details, Free Dialogue inputs, Import review lists) scroll normally without interception.
- Condition keyboard resize scroll resets in `handleResize` on `lockBodyScroll === true`.
- Refine `isTranslationActive` in `Practice.jsx` so body scroll lock is only active during the interactive translation practice session, not during loading, rating, or completion screens.
- Add test coverage for both locked and unlocked window scroll behavior.

**Non-Goals:**
- Changing the layout or styling of `TranslationStorySession` or `SeamlessChatSession`.
- Modifying how virtual keyboard height is measured.
- Altering the SRS card or prompt orchestration pipelines.

## Decisions

### Decision 1: Only attach the window scroll listener when `lockBodyScroll` is `true`

- **Choice**: Include `lockBodyScroll` in the hook's effect dependency array, and only call `window.addEventListener('scroll', handleWindowScroll)` if `lockBodyScroll` is truthy.
- **Alternatives considered**:
  - *Keep the listener always registered and check `if (lockBodyScroll)` inside `handleWindowScroll`*: While functional, this wastes CPU cycles on every scroll event across the application and leaves a global scroll listener active even when no locking is desired.
- **Rationale**: Conditionally attaching the listener ensures zero performance impact on standard scrollable pages and cleanly isolates the scroll-locking behavior.

### Decision 2: Guard `handleResize` scroll resets with `lockBodyScroll`

- **Choice**: In `handleResize`, only execute `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` if `lockBodyScroll` is `true` and `current.isKeyboardOpen` is `true`.
- **Alternatives considered**:
  - *Always reset scroll on keyboard open*: On normal scrollable pages with inputs near the bottom, resetting `window.scrollTo(0, 0)` upon keyboard open kicks the user's viewport away from the active input.
- **Rationale**: Keeps native mobile browser behavior intact for regular forms while preserving the locked dock behavior for full-screen translation interfaces.

### Decision 3: Narrow `isTranslationActive` condition in `Practice.jsx`

- **Choice**: In `Practice.jsx`, compute:
  ```javascript
  const isTranslationActive =
    practiceType === 'translation' &&
    translationSubMode === 'seamless' &&
    step !== 'loading' &&
    step !== 'empty' &&
    step !== 'complete' &&
    step !== 'rating';
  ```
- **Rationale**: Prevents `Practice.jsx` from locking body scroll prematurely during data load or while rating recall cards at the end of a session.

## Risks / Trade-offs

- **[Risk]** Transitioning between steps (e.g. from Step 1 to Step 2 in `Session.jsx`) toggles `lockBodyScroll` from `false` to `true`.
  - *Mitigation*: Having `lockBodyScroll` in the hook dependency array ensures the listener is cleanly attached when entering Step 2 and removed when leaving or resetting.
- **[Risk]** Test suites in happy-dom may mock `window.scrollTo`.
  - *Mitigation*: Verify and update existing tests in `useVisualViewport.test.jsx` to test both `lockBodyScroll: true` and `lockBodyScroll: false` scenarios explicitly.
