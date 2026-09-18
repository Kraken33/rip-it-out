# Proposal: Session Routing to Library with Pre-Filtered View

## Why

Currently on the Dashboard, expanding a topic displays session rows showing session date and phrase count badge. Clicking a session row does nothing. Users want to view all improvements from a specific session and have access to full Library actions (editing, deleting, filtering, SRS management) rather than a limited inline preview. Routing to the Library page with pre-filtered session criteria enables full functionality without duplicating Library features on the Dashboard.

## What Changes

- Update session rows in the Dashboard's topic list to be interactive links/buttons.
- Clicking a session row navigates the user to `/library?session=<sessionId>`.
- Ensure the Library page correctly respects and initializes session filter from query parameters, showing only improvements from that session and enabling full Library actions on them.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `library-search`: Update Library filtering requirements to ensure session filter query parameter (`?session=<id>`) correctly isolates session items and allows full improvement interactions.

## Impact

- **Frontend Components**:
  - `src/screens/Dashboard.jsx`: Add click handler/navigation on session rows in topic dropdown to navigate to `/library?session={sessionId}`.
  - `src/screens/Library.jsx`: Verify/update handling of `session` query param to ensure accurate filter application upon navigation.
