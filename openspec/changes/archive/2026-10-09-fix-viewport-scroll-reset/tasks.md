# Tasks

## 1. Viewport Hook Scope & Scroll Control

- [x] 1.1 Update `src/hooks/useVisualViewport.js` to guard scroll reset logic so `window.scrollTo(0, 0)` is executed only when `lockBodyScroll` is `true`, both on resize and on window scroll events.
- [x] 1.2 Update the `useEffect` hook in `src/hooks/useVisualViewport.js` to include `lockBodyScroll` in its dependency array and only register the `scroll` event listener on `window` when `lockBodyScroll` is `true`.
- [x] 1.3 Add tests to `src/__tests__/useVisualViewport.test.jsx` verifying that window scroll events do not trigger `window.scrollTo` when `lockBodyScroll` is `false`, and confirm existing lock tests continue to pass.

## 2. Screen Integration & Verification

- [x] 2.1 Refine `isTranslationActive` in `src/screens/Practice.jsx` so `lockBodyScroll` is not activated during `step === 'loading'`, `step === 'rating'`, `step === 'empty'`, or `step === 'complete'`.
- [x] 2.2 Run the complete Vitest test suite (`npm test`) to verify all session, practice, and viewport tests pass cleanly with zero failures.
