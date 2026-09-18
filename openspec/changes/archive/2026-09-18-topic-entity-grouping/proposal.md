# Proposal

## Why

The dashboard's "Recent Sessions" list displays every session as a flat, separate row even when the user watches the same show, reads the same book, or studies the same podcast across multiple sittings. A user who watches "Friends" five times sees five identical-looking rows, making it impossible to see topic coverage at a glance and cluttering the most-used screen in the app.

## What Changes

- **New `topics` collection** added to localStorage. A topic is a named entity that groups one or more sessions under a shared title.
- **`createSession`** now checks for an existing topic by title. If one exists, the new session is attached to it (`topicId` reference). If not, a new topic entity is created first.
- **One-time migration** on app load: every existing session without a `topicId` gets its own solo topic entity (1:1 mapping, safe and non-destructive).
- **Dashboard "Recent Sessions" section** is replaced by a **"Topics" collapsible list**: each row is a topic (title, session count, total phrase count, chevron). Clicking expands to reveal individual sessions inline (date + phrase count). No routing changes.

## Capabilities

### New Capabilities

- `topic-sessions`: A topic entity that aggregates sessions by title, supporting create, read, and migration from legacy session data.

### Modified Capabilities

- `session-flow`: Session creation now resolves or creates a parent topic entity before persisting the session. The existing title autofill requirement is unchanged; topic linkage is a transparent implementation detail.
- `data-store`: localStorage gains a new `topics` collection with CRUD helpers. The migration routine must run idempotently on every app load.

## Impact

- **`src/store.js`**: new `topics` storage key, `getTopics`, `getTopic`, `createTopic`, `getOrCreateTopic`, `migrateSessionsToTopics` functions. `createSession` updated to call `getOrCreateTopic`.
- **`src/screens/Dashboard.jsx`**: `recentSessions` list replaced by grouped topics UI with expand/collapse local state.
- **`src/screens/Session.jsx`**: `createSession` call is unchanged from the component's perspective; store handles topic resolution transparently.
- No routing changes, no new routes, no backend changes.
