# Proposal

## Why

In Russian translation practice, learners rate their recall inline on each card immediately after evaluation. However, if a learner exits early by clicking the finish button, the app incorrectly routes them to a redundant post-session "Rate Recall" screen, forcing them to re-evaluate cards they already scored and demanding scores for cards that were never rated. Clicking the finish button should immediately complete the session, persisting only the cards already evaluated and rated inline, ignoring any unrated active card.

## What Changes

- Modify translation practice session exit behavior: clicking the finish button immediately finishes the session and transitions straight to the session complete view, bypassing the sequential post-session "Rate Recall" step entirely.
- Exclude unrated active cards: if the learner leaves while a card is unrated (whether merely loaded or evaluated without a recall score), that card is excluded from SRS recall updates and the session completes with only the cards that were already rated inline.
- Update UI copy: rename the header button from "Finish & Rate Recall →" to "Finish Practice" and update the completion banner copy so it no longer asks "Ready to rate your recall?".
- Preserve session persistence: persist completed rounds in session history and log elapsed activity duration when finishing via the button.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `russian-practice`: Update the "Transition to Manual SRS Recall Rating" requirement to specify that finishing a translation practice session via the finish button terminates the session immediately, persists only cards that were evaluated and rated inline, ignores any unrated active card, and transitions directly to the completion view without presenting a post-session rating screen.

## Impact

- **Code**: `src/screens/TranslationPracticeSession.jsx` (update button label to "Finish Practice", pass `ratedInline: true` on finish, update completion banner text) and `src/screens/Practice.jsx` (ensure `startRating` directly transitions to complete without entering the rating step).
- **Tests**: `src/__tests__/Practice.test.jsx` and `src/__tests__/TranslationPracticeSession.test.jsx` (update assertions to verify immediate completion and button label changes).
