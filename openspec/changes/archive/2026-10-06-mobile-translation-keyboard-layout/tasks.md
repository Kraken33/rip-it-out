# Tasks

## 1. Preemptive Body Scroll Lock & Instant Focus Scroll Suppression

- [x] 1.1 Update `src/hooks/useVisualViewport.js` and session screens (`Session.jsx`, `Practice.jsx`) to preemptively lock `document.body` scrolling on mobile mount and provide instant scroll suppression (`behavior: 'instant'`) without delayed `setTimeout` lag. Verify via unit tests in `src/__tests__/useVisualViewport.test.jsx`.

## 2. Translation Story Session Instant Keyboard Activation & Full-Width Composer

- [x] 2.1 Refactor focus event handling in `src/screens/TranslationStorySession.jsx` to use instant scroll suppression without delayed timeouts or sluggish animation. Verify via component tests in `src/__tests__/TranslationStorySession.test.jsx`.
- [x] 2.2 Verify full-width translation textarea and collapsible action drawer remain responsive and clean in `src/screens/TranslationStorySession.jsx`. Verify via component tests in `src/__tests__/TranslationStorySession.test.jsx`.

## 3. Russian Translation Practice Session Instant Keyboard Activation & Full-Width Composer

- [x] 3.1 Refactor focus event handling in `src/screens/TranslationPracticeSession.jsx` to use instant scroll suppression without delayed timeouts. Verify via tests in `src/__tests__/TranslationPracticeSession.test.jsx`.
- [x] 3.2 Verify full-width translation textarea and collapsible action drawer remain responsive and clean in `src/screens/TranslationPracticeSession.jsx`. Verify via tests in `src/__tests__/TranslationPracticeSession.test.jsx`.

## 4. Verification & Regression Testing

- [x] 4.1 Run the full test suite (`npm test`) to verify all translation story, Russian practice, SRS review, and session flow tests pass without regression.
