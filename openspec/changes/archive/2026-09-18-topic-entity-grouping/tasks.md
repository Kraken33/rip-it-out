# Tasks

## 1. Store — Topics Collection

- [x] 1.1 Add `rio_topics` to `STORAGE_KEYS` in `src/store.js` and verify the key is used consistently by all new topic functions (no magic strings elsewhere).
- [x] 1.2 Implement `getTopics()`, `getTopic(id)`, `createTopic({ title })`, and `getOrCreateTopic(title)` in `src/store.js`; verify with unit tests: new title creates a topic, existing title returns the same topic, `getTopic` returns null for unknown id.
- [x] 1.3 Update `createSession` to call `getOrCreateTopic(title)` and set `session.topicId` before persisting; verify the returned session object includes `topicId`.

## 2. Store — Migration

- [x] 2.1 Implement `migrateSessionsToTopics()` in `src/store.js`: for each session missing `topicId`, create a solo topic and write `topicId` back to the session; verify with a unit test that sessions without `topicId` gain one and sessions already having `topicId` are unchanged.
- [x] 2.2 Call `migrateSessionsToTopics()` at module-load time (module-level call, after function definitions) in `src/store.js`; verify the migration runs on first import and produces an empty no-op on subsequent imports when all sessions are already migrated.

## 3. Store — Export / Import

- [x] 3.1 Update `exportAllData()` to include the `topics` collection in the exported JSON; verify the snapshot includes a `topics` key.
- [x] 3.2 Update `importData()` to restore the `topics` collection when present in the import payload; verify a round-trip export → import preserves all topic entities and their `sessionIds` arrays.

## 4. Dashboard — Collapsible Topics UI

- [x] 4.1 Add a `getTopicsWithSessions()` helper to `src/store.js` that returns topics enriched with their full session objects and total phrase count, sorted by most recent session `createdAt` descending; verify with a unit test covering sort order and phrase count aggregation.
- [x] 4.2 Replace `recentSessions` state in `Dashboard.jsx` with `topics` state loaded from `getTopicsWithSessions()`; verify the component renders a list of topic group headers instead of flat session rows.
- [x] 4.3 Add `expandedTopics` state (`useState(new Set())`) to `Dashboard.jsx` and wire toggle logic to each topic header click; verify clicking a closed group opens it and clicking again closes it.
- [x] 4.4 Render each expanded topic's sessions as a nested list showing relative date and phrase count; verify that sessions appear below their parent header when expanded and are hidden when collapsed.
- [x] 4.5 Style the topic group header (icon derived from most common source type in group, title, session count badge, phrase count badge, animated chevron); verify the chevron rotates on expand/collapse and the component matches the app's glass-panel aesthetic.

## 5. Tests

- [x] 5.1 Write BDD-style unit tests for `getOrCreateTopic` covering: new title → new topic, existing title → same topic returned, id on returned object is stable across calls.
- [x] 5.2 Write BDD-style unit tests for `migrateSessionsToTopics` covering: fresh migration adds `topicId` to all sessions, idempotent re-run leaves data unchanged, migrated sessions each get their own solo topic.
- [x] 5.3 Write a React Testing Library test for `Dashboard.jsx` that verifies: topic group headers render, clicking a header reveals session rows, clicking again hides them.
- [x] 5.4 Run `npm test` and verify all existing and new tests pass with no regressions.
