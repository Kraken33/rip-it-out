# Tasks

## 1. Interactive Construction Highlighting

- [x] 1.1 Update passage construction tag rendering in `TranslationPracticeSession.jsx` so that `[[Russian phrase|target construction]]` renders interactive highlighted spans that reveal the target construction on click/tap rather than displaying static inline text labels, and verify with unit tests.

## 2. Streamlining Practice Session Layout

- [x] 2.1 Remove the separate "Round Targets:" chip strip above the message feed in `TranslationPracticeSession.jsx` to eliminate redundant vertical space, and verify layout rendering.
- [x] 2.2 Remove robot avatars (`🤖`) and side margins from message items in `TranslationPracticeSession.jsx` so passage cards take full container width, and verify visual alignment.
- [x] 2.3 Consolidate the session header in `TranslationPracticeSession.jsx` into a single compact bar featuring the round counter and finish/menu controls, aligning with `TranslationStorySession.jsx`.

## 3. Practice Screen Container Clean-Up

- [x] 3.1 Update `Practice.jsx` to suppress the outer mode selection tabs and sub-mode tabs when actively running Seamless Translation Practice mode, giving full screen height and width to the translation session while providing an exit option.

## 4. Verification and Regression Testing

- [x] 4.1 Run the full test suite (`npm run test`) to verify that all translation practice, story session, and SRS flow unit tests pass cleanly without regressions.
