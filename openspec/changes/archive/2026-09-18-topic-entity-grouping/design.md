# Design

## Context

The app uses a single `localStorage` store with flat collections keyed by `rio_*` strings. Sessions are the primary entity; improvements and SRS cards reference them by `sessionId`. There is no `topics` collection today. The dashboard loads all sessions, sorts by `createdAt` desc, and slices to 5 for display. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Introduce a `topics` localStorage collection with minimal schema change
- Keep `createSession` API surface identical for callers (Session.jsx needs no change)
- Run a one-time, idempotent migration on app load for all legacy sessions
- Replace the flat recent-sessions list on the Dashboard with a collapsible topic list, entirely in-component local state

**Non-Goals:**
- Routing to a topic-scoped view (deferred; no `/topics/:id` route in this change)
- Renaming topics after creation
- Merging two existing topics
- Changing how improvements or SRS cards are indexed (they stay session-scoped)

## Decisions

### Decision 1: `topics` as a first-class localStorage collection, not derived state

**Chosen:** Add `rio_topics` key alongside `rio_sessions`.

**Alternative:** Derive grouping on the fly by reducing sessions by title on every render.

**Rationale:** A first-class collection gives `getOrCreateTopic` a stable id to write into each session's `topicId`. Derived grouping would produce no stable ids, meaning session→topic linkage couldn't be persisted. The small write cost on session creation is negligible compared to the structural clarity.

---

### Decision 2: 1:1 solo-topic migration for legacy sessions

**Chosen:** Each existing session without a `topicId` becomes its own solo topic entity.

**Alternative:** Auto-merge legacy sessions with matching titles into shared topics.

**Rationale:** The user explicitly preferred the safe path. Auto-merging would change the apparent structure of existing data without user consent. Solo topics are additive and non-destructive; the user can create new sessions under an existing title to start grouping going forward.

---

### Decision 3: Topic title matching is exact and case-sensitive

**Chosen:** `getOrCreateTopic(title)` looks up topics by `title === incoming`.

**Alternative:** Case-insensitive or trimmed matching.

**Rationale:** Session autofill already populates the title from a stored string (exact match), so in practice titles will match exactly. Case-insensitive matching adds complexity and risks merging topics the user considers distinct ("Friends S3" vs "friends s3"). Exact match is the simplest safe default.

---

### Decision 4: Dashboard collapse state is local React state, not persisted

**Chosen:** `expandedTopics` is a `useState(Set)` inside `Dashboard.jsx`.

**Alternative:** Persist expanded state in localStorage or a URL param.

**Rationale:** Collapse state is a transient UI preference. Persisting it adds store complexity for minimal user value. Page reload resetting collapsed state is acceptable.

---

### Decision 5: `migrateSessionsToTopics` called at module load time in store.js

**Chosen:** The migration function is called once when `store.js` is first imported (module-level side effect, guarded by checking `topicId` presence).

**Alternative:** Call it lazily from `App.jsx` on first render.

**Rationale:** The store module is the right place to own data integrity. Calling it at module load ensures no consumer ever sees un-migrated sessions, regardless of which screen loads first. The guard (`if session.topicId exists → skip`) makes it idempotent.

## Risks / Trade-offs

- **Risk: localStorage quota** → Writing topics in addition to sessions increases storage use slightly. Mitigation: topics are small (id, title, timestamp, array of ids); negligible in practice.
- **Risk: Migration runs on every import during tests** → Tests that manipulate sessions in isolation may see unexpected topics. Mitigation: `beforeEach` in test setup already clears localStorage; migration will produce an empty no-op.
- **Risk: Title mismatch breaks grouping** → If a user manually edits localStorage or imports data with inconsistent titles, sessions may not group as expected. Mitigation: `getOrCreateTopic` is the single write path; data imported via `importData` should include the `topics` collection as of this change.

## Migration Plan

1. On first app load after deploy, `migrateSessionsToTopics()` runs automatically (module-level call in `store.js`).
2. For each session missing `topicId`: create a solo topic, write `session.topicId = topic.id`, persist both.
3. Function is idempotent: sessions already having `topicId` are skipped.
4. No rollback needed: the migration only adds data; removing the `rio_topics` key and `topicId` fields from sessions restores the pre-migration state exactly.
