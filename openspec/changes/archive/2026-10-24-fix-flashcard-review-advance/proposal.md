# Proposal

## Why

During flashcard review, rating a card (Again, Hard, Good, Easy) triggers an unhandled `ReferenceError` caused by an orphaned reference to `setShowExamplesPrompt`, which was removed when manual prompt generation was deprecated. This exception aborts state progression before `currentIndex` can increment or the session can complete, causing the card to flip back to the front while remaining stuck on the same card indefinitely.

## What Changes

- Remove the undefined `setShowExamplesPrompt(false)` call inside `handleRating` in `src/screens/Review.jsx`.
- Ensure card evaluation properly advances `currentIndex` to the next card or marks the session complete when all queued cards have been evaluated.
- Add test coverage in `src/__tests__/Review.test.jsx` for evaluating cards with SRS scores (Again, Hard, Good, Easy), verifying queue advancement and session completion.
- Rebuild production assets (`docs/assets/`).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `flashcard-review`: Clarify requirement for card evaluation progression, ensuring that rating a card advances the review queue to subsequent cards or completes the session.

## Impact

- Modified files: `src/screens/Review.jsx`, `src/__tests__/Review.test.jsx`, `docs/assets/`.
- User impact: Users can successfully review and advance through their flashcard queue and reach session completion.
