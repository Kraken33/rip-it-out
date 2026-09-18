# Design: Session Navigation to Pre-Filtered Library

## Context

See `proposal.md` for motivation. Instead of an inline expansion on the Dashboard, clicking a session row navigates the user directly to the Library screen pre-filtered for that session. This gives the user access to full Library features (editing, resetting SRS, deleting, category filtering) for that specific session.

## Goals / Non-Goals

**Goals:**
- Make session rows on `Dashboard.jsx` clickable to navigate to `/library?session=<sessionId>`.
- Ensure `Library.jsx` reads `session` URL parameter and sets the session filter state accordingly.
- Support full interaction on session improvements within the Library screen.

**Non-Goals:**
- Inline rendering of improvements on the Dashboard screen.

## Decisions

### Decision 1: URL Query Parameter (`?session=<id>`) Navigation

- **Choice**: Use `react-router-dom` `useNavigate` in `Dashboard.jsx` to direct to `/library?session=${session.id}`.
- **Rationale**: Clean, RESTful parameter handling. Allows bookmarking or direct navigation to a session's improvements in the Library.

### Decision 2: Library URL Sync

- **Choice**: Read `useSearchParams()` in `Library.jsx` on mount/update and set `selectedSession` filter state.
- **Rationale**: Existing `Library.jsx` already supports session filtering; ensuring URL query param synchronization enables smooth cross-screen navigation.

## Risks / Trade-offs

- None identified.
