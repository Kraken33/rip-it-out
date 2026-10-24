# Proposal

## Why

Currently, Seamless Russian Translation Practice (`TranslationPracticeSession`) renders a scrolling chat interface that automatically triggers the next round's sentence generation as soon as an evaluation arrives, and defers all SRS recall ratings until a separate batch-rating screen at the end of the session. Replacing the chat log with a focused, single-card interface—where each card presents the Russian sentence with a pre-focused translation input, shows the evaluation inline upon submission, and lets the learner immediately rate their recall (`Again`, `Hard`, `Good`, `Easy`) or generate another sentence for the same construction—gives the learner full pacing control and captures recall ratings while the attempt is still fresh.

## What Changes

- **Card-Style Seamless Translation Interface**: Replace the scrolling chat-thread layout (`InteractiveSessionShell` message list) in `TranslationPracticeSession` with a focused card view displaying one active Russian sentence at a time, progress indicator (`Card X of Y`), and audio playback support.
- **Pre-Focused Translation Input**: Provide an auto-focused (`autoFocus`) multi-line translation input with voice dictation inside the card so the learner can immediately type and submit their English translation (`Ctrl/Cmd + Enter` or Submit button) when a sentence loads.
- **Post-Translation Evaluation & Manual Pacing**: Stop auto-advancing or auto-retrying immediately after evaluation. Instead, transition the active card into an evaluated state showing the learner's submitted translation, the structured `VerdictCard` feedback (coverage badge, summary, natural rewrite, and notes), and the target construction's reference details.
- **On-Demand Retry ("Generate Another Sentence")**: In the evaluated card state, provide a button to generate a fresh Russian sentence for the **same** target construction, clearing and re-focusing the translation input so the learner can practice the phrase again if they feel they haven't mastered it yet.
- **Immediate Per-Card SRS Recall Rating**: In the evaluated card state, display inline SRS rating controls (`Again`, `Hard`, `Good`, `Easy`, plus keyboard shortcuts `1–4`) that immediately persist the card's updated FSRS schedule and advance to the next card in the queue (eliminating the separate end-of-session batch rating step for Seamless AI mode while preserving it for external Prompt #3 / Prompt #5 modes).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `russian-practice`: Replace the chat-thread auto-branching flow and deferred post-session batch rating in Seamless AI translation practice with a single-card workflow featuring a pre-focused translation input, inline evaluation display, on-demand "Generate another sentence" retry for the active construction, and immediate per-card SRS recall rating (`Again`, `Hard`, `Good`, `Easy`).
- `translation-session-history`: Update the empty-session completion scenario so ending a seamless translation session without submitted rounds transitions to the session completion state rather than a deferred batch SRS rating screen.

## Impact

- **`src/screens/TranslationPracticeSession.jsx`**: Replace `InteractiveSessionShell` chat message list and automatic post-verdict round branching with a single-card state machine (`loading-sentence` → `translating` → `evaluating` → `evaluated` → `completed`), auto-focused translation textarea + `AudioRecorder`, "Generate another sentence" action, and inline SRS recall rating buttons (`1–4` / `Again`, `Hard`, `Good`, `Easy`).
- **`src/screens/Practice.jsx`**: Pass per-card SRS rating handler (or card lookup) to `TranslationPracticeSession` so ratings are persisted immediately via `processReview` + `updateSrsCard`, and transition Seamless AI sessions directly to `complete` upon finishing (after saving the `translation-practice` session artefact and activity log), while keeping the post-session `rating` step for Prompt #3 and Prompt #5 copy-paste modes.
- **`src/__tests__/TranslationPracticeSession.test.jsx` & `src/__tests__/Practice.test.jsx`**: Update unit and integration tests for the card-style UI, pre-focused input, manual "Generate another" retry, and immediate inline SRS rating.
