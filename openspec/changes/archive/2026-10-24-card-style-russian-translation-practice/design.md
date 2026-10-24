# Design

## Context

See `proposal.md` for motivation. Currently, `Practice.jsx` loads up to 20 due/upcoming SRS cards (`selectedCards`) and their hydrated `improvements`, then renders `TranslationPracticeSession` inside a full-height viewport lock container when `practiceType === 'translation'` and `translationSubMode === 'seamless'`. `TranslationPracticeSession` uses `InteractiveSessionShell` to render a scrolling chat thread (`messages`), automatically triggers `loadRoundSentence` for the next card (or retries the same card) inside `requestVerdict`, and only hands off to `Practice.jsx` (`startRating`) at the end of the session for batch SRS recall rating.

By contrast, `Review.jsx` and `FrequencyPracticeSession.jsx` use a self-contained single-card layout (`glass-panel`) with progress bars and inline `RATINGS` buttons (`Again`, `Hard`, `Good`, `Easy` + keyboard `1–4`).

## Goals / Non-Goals

**Goals:**
- Replace the scrolling chat log in `TranslationPracticeSession` with a single-card state machine that focuses on one target construction and one Russian sentence at a time.
- Auto-focus the translation `<textarea>` whenever a Russian sentence finishes loading (initial load, next card, or "Generate another sentence" retry).
- Stop automatic post-evaluation round advancing; keep the card on the evaluated view until the user explicitly chooses to either **Generate Another Sentence** for the current construction or **Rate Recall (`Again`, `Hard`, `Good`, `Easy`)** to advance to the next card.
- Persist each card's FSRS update immediately when rated inline during Seamless AI practice, and transition directly to the session completion screen when finished, while preserving the `translation-practice` session history artefact and word/time metrics.

**Non-Goals:**
- Changing the underlying AI prompts or JSON verdict format (`generateTranslationSentence`, `evaluateTranslationRound`, `parseTranslationVerdict`).
- Modifying Prompt #3 (Scenario Q&A) or Prompt #5 (copy-paste external LLM translation prompt) or their post-session manual rating step in `Practice.jsx`.
- Modifying `InteractiveSessionShell`, which remains used by `SeamlessChatSession` and `TranslationStorySession`.

## Decisions

### 1. Single-Card State Machine in `TranslationPracticeSession`
- **Decision**: Replace the `messages` array and `InteractiveSessionShell` wrapper in `TranslationPracticeSession` with explicit card states for the active card (`activeCardIndex`):
  - `loading`: Fetching the Russian sentence for `allCards[activeCardIndex]` via `generateTranslationSentence`.
  - `translating`: Displaying the generated Russian sentence (with `AudioPlayerButton`), the pre-focused multi-line translation `<textarea>` (with caret-aware `AudioRecorder` dictation), and the `Translate` submit button (`Ctrl/Cmd + Enter`).
  - `evaluating`: Displaying the Russian sentence, the learner's submitted translation, and a loading indicator while `evaluateTranslationRound` is in flight.
  - `evaluated`: Displaying the Russian sentence, the learner's submitted translation, the `VerdictCard` (or unparsed fallback with `Retry evaluation ↻`), reference details for the target construction (`improved` example + `explanation`), a **"🔄 Generate Another Sentence"** button, and the 4 inline SRS recall rating buttons (`1: Again`, `2: Hard`, `3: Good`, `4: Easy`).
- **Rationale**: A discrete per-card state machine eliminates message-array filtering, scroll-to-bottom race conditions, and mobile chat-dock complexity while making each phase of the card self-explanatory.
- **Alternatives considered**: Keeping `InteractiveSessionShell` and clearing `messages` between cards. Rejected because a chat composer dock at the bottom of the screen separates the input and rating controls from the card content and requires mobile viewport locking.

### 2. Immediate Per-Card SRS Rating vs. End-of-Session Batch Rating
- **Decision**: Add an `onRateCard(cardItem, score)` callback prop from `Practice.jsx` to `TranslationPracticeSession` (alongside existing `allCards`, `settings`, `onFinish`, `onExit`).
  - When the user clicks a rating button (`1–4` or keyboard `1–4` while in the `evaluated` state and not focused in an input), `TranslationPracticeSession` invokes `onRateCard(currentCard, score)` which looks up the matching SRS card in `Practice.jsx` (by `improvementId` or `id`), computes `processReview(srsCard, score)`, and calls `updateSrsCard(srsCard.improvementId, updates)`.
  - After rating, if `activeCardIndex + 1 < allCards.length`, `TranslationPracticeSession` advances `activeCardIndex` and loads the Russian sentence for the next card. If the user just rated the final card in `allCards`, `TranslationPracticeSession` automatically calls `handleFinishSession()` (which invokes `onFinish(orderedRounds, practicedImprovements, { ratedInline: true })`) so the session artefact is saved and `Practice.jsx` transitions directly to `step === 'complete'`.
  - If the user clicks **"Finish Session"** early in the header, `handleFinishSession()` also saves any submitted rounds and transitions directly to `step === 'complete'` (since any completed cards were already rated inline, or if `onFinish` is called in standalone/custom mode without inline rating, `Practice.jsx` respects whether cards remain unrated).
- **Rationale**: Rating recall immediately after seeing the evaluation verdict captures accurate memory feedback and removes the redundant second pass through all practiced cards at the end of a Seamless AI session.
- **Alternatives considered**: Accumulating ratings in memory and writing them all in `onFinish`. Rejected because immediate persistence via `updateSrsCard` (matching `Review.jsx` and `FrequencyPracticeSession.jsx`) prevents losing SRS progress if the user closes the tab mid-session.

### 3. On-Demand "Generate Another Sentence" Retry Flow
- **Decision**: In the `evaluated` state, clicking **"Generate Another Sentence"** increments `currentRoundIndex`, keeps `activeCardIndex` unchanged, clears `inputText` and the current evaluation state, and calls `loadRoundSentence(nextRoundIndex, currentCard)` to fetch a fresh Russian sentence for the same construction. Every submitted attempt is still appended to `submittedRoundsRef.current` so all attempts are preserved in the saved `translation-practice` session artefact and word count metrics.
- **Rationale**: Gives the learner unlimited practice attempts on a construction they struggled with (or want to reinforce) before committing their SRS rating and moving on.

### 4. Pre-Focusing the Translation Input
- **Decision**: Attach `inputRef` to the translation `<textarea>` and trigger `inputRef.current?.focus()` in a `useEffect` whenever `roundLoading` transitions to `false` and a `currentSentence` is present (and no evaluation is active).
- **Rationale**: Ensures zero-click typing readiness both on the first card and after clicking either a rating button (next card) or "Generate Another Sentence" (same card).

## Risks / Trade-offs

- **[Risk] Keyboard shortcut conflicts between typing and rating (`1–4`)** → Mitigation: Only listen for `1`, `2`, `3`, `4` rating shortcuts when the card is in the `evaluated` state (when the translation `<textarea>` is not rendered or disabled) and `e.target.tagName` is not `INPUT` or `TEXTAREA`.
- **[Risk] Existing unit tests in `TranslationPracticeSession.test.jsx` and `Practice.test.jsx` assert chat-specific DOM and auto-advancing behavior** → Mitigation: Update tests in both files to verify the card-based states, pre-focused textarea, manual "Generate Another Sentence" retry, and inline SRS rating persistence while keeping all verdict-badge, dictation, and session-artefact assertions intact.
