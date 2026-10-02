# Tasks

## 1. Responsive Container and Layout Structure

- [x] 1.1 Update `TranslationPracticeSession.jsx` outer container to use responsive dynamic viewport height (`h-[calc(100dvh-5.5rem)] sm:h-[82vh]`) and flexible scrolling, verifying layout responsiveness in component tests.
- [x] 1.2 Refactor the session header in `TranslationPracticeSession.jsx` to be responsive (`flex-col sm:flex-row`), adjusting typography and badge alignment for small mobile viewports, and verify no header text clipping occurs.
- [x] 1.3 Optimize the round target chips bar for mobile screens with touch-friendly horizontal scrolling and compact padding.

## 2. Responsive Controls Toolbar and Audio Recorder

- [x] 2.1 Update `AudioRecorder.jsx` with responsive button padding and compact sizing for mobile toolbars, verifying audio recording and transcription callbacks remain intact in unit tests.
- [x] 2.2 Restructure the bottom controls toolbar in `TranslationPracticeSession.jsx` to allow the audio recorder, `Next Round →`, and `Finish Practice ✓` buttons to wrap gracefully on mobile viewports without horizontal overflow.
- [x] 2.3 Refactor the translation input form and `Translate ▶` button to optimize vertical space on mobile devices (hiding or adapting desktop keyboard hints on small viewports) and ensure smooth virtual keyboard behavior.

## 3. Verification and Regression Testing

- [x] 3.1 Add mobile viewport and responsive layout test cases to `src/__tests__/TranslationPracticeSession.test.jsx` and verify all existing tests pass (`npm test`).
- [x] 3.2 Run project-wide test suite (`npm test`) and build check (`npm run build`) to ensure zero regressions.
