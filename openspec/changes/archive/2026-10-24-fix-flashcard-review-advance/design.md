# Design

## Context

See `proposal.md` for motivation. In `src/screens/Review.jsx`, `handleRating` processes SRS calculation and card state, flips `showAnswer` back to `false`, and calls `setShowExamplesPrompt(false)`. Because manual prompt UI was removed in commit `386fd74`, `setShowExamplesPrompt` is no longer defined. Calling it throws a runtime `ReferenceError`, halting execution before `setCurrentIndex((prev) => prev + 1)` or `setSessionComplete(true)` can be evaluated.

## Goals / Non-Goals

**Goals:**
- Eliminate the runtime exception by removing `setShowExamplesPrompt(false)`.
- Ensure smooth progression through the review card queue and proper transition to the session complete view.
- Introduce integration tests in `src/__tests__/Review.test.jsx` covering card evaluation, next card advancement, and session completion.

**Non-Goals:**
- Reintroducing manual prompt copying into Flashcard Review.
- Modifying the underlying SRS engine or FSRS rating calculations.
- Changing review UI layout or styling.

## Decisions

### 1. Remove Orphaned State Setter Reference
- **Decision**: Directly remove `setShowExamplesPrompt(false)` from `handleRating`.
- **Alternatives Considered**: Re-declaring `showExamplesPrompt` as dummy state. Rejected because manual prompt generation is explicitly deprecated and the state serves no purpose.

### 2. Multi-Card Integration Test Coverage
- **Decision**: Expand `src/__tests__/Review.test.jsx` to seed multiple flashcards and verify clicking rating buttons (`Good`, `Again`, `Easy`) increments the card index and eventually renders the session complete summary.
- **Alternatives Considered**: Unit testing `handleRating` in isolation. Rejected because end-to-end user interaction in `Review.jsx` ensures that button clicks, state transitions, and component rendering stay aligned.

## Risks / Trade-offs

- **[Risk] Re-queued cards from "Again" rating getting mishandled** → Mitigation: Test rating with `Again` (1) to ensure the card appends to the queue and can be re-evaluated later in the session.
