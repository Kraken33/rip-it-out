# Proposal

## Why

Currently, when 0 cards are due for review today, clicking "Flashcard Review" or "Practice with LLM" shows an empty "You're all caught up!" state and prevents users from practicing. Users want the "Due for Review" dashboard widget counter to strictly reflect urgent/due cards, while still allowing them to practice at any time by fetching upcoming ("coming soon") constructions.

## What Changes

- **Always Available Flashcard Review**: When launching Flashcard Review (`/review`) with 0 due cards, automatically fallback to fetching the top 5 upcoming ("coming soon") cards sorted by scheduled review date, allowing continuous practice.
- **Always Available LLM Practice**: When launching LLM Practice (`/practice`) with 0 due cards, automatically fallback to fetching the top 5 upcoming ("coming soon") cards for Scenario Q&A and Translation Practice modes.
- **Dashboard Due Counter Integrity**: Keep the Dashboard "Due for Review" widget counter reflecting only urgent/due cards (e.g. `dueToday`), while keeping review and practice action buttons active and functional at all times.
- **Empty Vault Safeguard**: Only present the empty state screen if there are zero total cards/phrases saved in the entire user vault.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `flashcard-review`: Require fallback to top 5 upcoming ("coming soon") cards when 0 cards are due today so review is always available.
- `russian-practice`: Require fallback to top 5 upcoming ("coming soon") cards when 0 cards are due today so practice modes are always available.

## Impact

- Frontend screens `src/screens/Practice.jsx`, `src/screens/Review.jsx`, and store queries in `src/store.js`.
- User experience: Users can practice constructions on demand at any time, even when caught up on urgent daily reviews.
