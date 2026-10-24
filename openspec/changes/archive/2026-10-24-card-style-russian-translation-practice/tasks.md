# Tasks

## 1. Card-Style Translation Practice Session Component

- [x] 1.1 Refactor `src/screens/TranslationPracticeSession.jsx` from the `InteractiveSessionShell` chat thread to a single-card state machine (`loading`, `translating`, `evaluating`, `evaluated`) displaying card progress (`Card X of Y`), the active Russian sentence with `AudioPlayerButton`, and session header actions (`Exit`, `Finish Session`), and verify it renders the active card without chat history
- [x] 1.2 Implement the pre-focused multi-line translation `<textarea>` (`autoFocus` / ref focus on sentence load), `Ctrl/Cmd + Enter` submit shortcut, and caret-aware `AudioRecorder` insertion inside the active card in `src/screens/TranslationPracticeSession.jsx`, and verify focus and input behavior in `src/__tests__/TranslationPracticeSession.test.jsx`
- [x] 1.3 Update `requestVerdict` in `src/screens/TranslationPracticeSession.jsx` to stop auto-advancing or auto-retrying after evaluation and instead transition the active card to the `evaluated` state showing the learner's submitted translation, `VerdictCard` (or unparsed fallback with retry), and target construction reference details (`improved` example and `explanation`), and verify the card stays on the evaluation view in `src/__tests__/TranslationPracticeSession.test.jsx`
- [x] 1.4 Add the **"Generate Another Sentence"** button and inline SRS recall rating controls (`Again`, `Hard`, `Good`, `Easy` plus keyboard shortcuts `1–4`) to the `evaluated` state of `src/screens/TranslationPracticeSession.jsx` so learners can either generate a fresh Russian sentence for the current construction or rate recall (`onRateCard`) to advance to the next card, and verify both flows with unit tests in `src/__tests__/TranslationPracticeSession.test.jsx`

## 2. Immediate SRS Recall Persistence and Session Completion in Practice Screen

- [x] 2.1 Update `src/screens/Practice.jsx` to pass an `onRateCard(cardItem, score)` callback into `TranslationPracticeSession` that immediately updates the matching SRS card via `processReview` and `updateSrsCard`, and remove the full-viewport chat scroll-lock wrapper when rendering the card-style session, verifying via `src/__tests__/Practice.test.jsx`
- [x] 2.2 Update the session finish handler in `src/screens/Practice.jsx` so finishing a Seamless AI translation session saves the `translation-practice` session artefact and activity log (when translations were submitted) and transitions directly to `step === 'complete'` when cards were rated inline (while preserving the `step === 'rating'` screen for Prompt #3 and Prompt #5 copy-paste modes), and verify all completion and rating paths in `src/__tests__/Practice.test.jsx`

## 3. Integration Verification

- [x] 3.1 Run the full Vitest suite (`npm test -- --run`) and `openspec validate "card-style-russian-translation-practice"` to verify all unit, integration, and spec checks pass with zero regressions
