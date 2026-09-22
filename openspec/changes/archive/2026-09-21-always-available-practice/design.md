# Design

## Context

See `proposal.md` for motivation. Currently `Practice.jsx` and `Review.jsx` query `getDueCards()` and halt with an empty state if `due.length === 0`. To allow always-available practice while maintaining the urgency of the `dueToday` counter on `Dashboard.jsx`, the store and screen components need a fallback retrieval strategy.

## Goals / Non-Goals

**Goals:**
- Provide a unified store helper (`getPracticeCards(limit, fallbackLimit)`) that yields due cards first, or falls back to top `fallbackLimit` (5) upcoming cards when `dueToday === 0`.
- Update `Practice.jsx` and `Review.jsx` to utilize fallback cards when 0 cards are due today.
- Preserve the empty state screen strictly for when the total count of cards in the vault is 0.
- Keep `Dashboard.jsx` counter displaying only urgent due cards (`dueToday`).

**Non-Goals:**
- Changing SM-2 SRS calculation rules for reviewed cards.
- Adding artificial due cards to the SRS queue in the database.

## Decisions

- **Decision 1: Store Helper Function (`getPracticeCards`)**:
  - *Rationale*: Centralize the logic for retrieving cards for practice/review sessions so `Practice.jsx` and `Review.jsx` stay clean and consistent.
  - *Fallback Strategy*: If `getDueCards()` returns cards, return up to `limit` due cards. Otherwise, query `getSrsCards()`, sort by `nextReview` ascending, and return top `fallbackLimit` (default 5) cards.

- **Decision 2: UI Banner/Subtitle for Fallback Practice**:
  - *Rationale*: When 0 cards are due today, inform the user they are practicing upcoming/coming soon constructions so they understand why cards are loaded even when caught up.

- **Alternatives Considered**:
  - *Overriding dueToday counter on Dashboard*: Rejected because user explicitly wants the due counter to show only urgent cards while keeping practice buttons accessible.

## Risks / Trade-offs

- [Practicing non-due cards affects SRS schedule] → Mitigation: Standard SM-2 behavior applies when rated; reviewed cards push their `nextReview` further into the future, which is expected.
