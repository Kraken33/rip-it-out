# Tasks

## 1. Viewport & Scroll Synchronization Utility

- [x] 1.1 Add/enhance viewport resize and focus scroll helper logic in `useVisualViewport.js` to coordinate immediate and delayed scroll-to-latest alignment when the virtual keyboard opens. Verify with unit tests in `src/__tests__/useVisualViewport.test.jsx`.

## 2. Translation Story Session Focus Alignment

- [x] 2.1 Integrate focus and viewport resize auto-scrolling into `TranslationStorySession.jsx` so focusing the translation textarea scrolls the active Russian story passage card into view above the composer dock. Verify with component tests in `src/__tests__/TranslationStorySession.test.jsx`.

## 3. Russian Translation Practice Session Focus Alignment

- [x] 3.1 Integrate focus and viewport resize auto-scrolling into `TranslationPracticeSession.jsx` so focusing the translation textarea scrolls the active Russian practice passage into view above the composer dock. Verify with component tests in `src/__tests__/TranslationPracticeSession.test.jsx`.

## 4. Seamless Chat Session Focus Alignment

- [x] 4.1 Integrate focus and viewport resize auto-scrolling into `SeamlessChatSession.jsx` so focusing the message input textarea scrolls the latest AI coach message into view. Verify with component tests in `src/__tests__/SeamlessChatSession.test.jsx`.

## 5. Verification & Test Suite Run

- [x] 5.1 Run full project test suite with `npm test` and verify all tests pass without errors or regressions.
