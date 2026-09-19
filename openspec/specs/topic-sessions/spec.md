# Topic Sessions Specification

## Purpose

Provides a named topic entity that groups one or more learning sessions under a shared title, enabling the dashboard to aggregate and collapse sessions by topic.

## Requirements

### Requirement: Topic entity aggregates sessions by title
The system SHALL maintain a `topics` collection in localStorage where each topic has a unique id, a title, a creation timestamp, and an ordered list of session ids.

#### Scenario: New topic created on first use of a title
- **WHEN** a session is created with a title that has no matching topic
- **THEN** a new topic entity is created with that title and the session id is added to it

#### Scenario: Existing topic updated on reuse of a title
- **WHEN** a session is created with a title that matches an existing topic's title (case-sensitive)
- **THEN** no new topic is created and the new session id is appended to the existing topic's session list

### Requirement: Migration runs once on app load
The system SHALL run an idempotent migration that creates a solo topic entity for every existing session that has no `topicId`, linking the session to its new topic.

#### Scenario: Legacy sessions are migrated without data loss
- **WHEN** the app loads and sessions without a `topicId` exist in localStorage
- **THEN** each such session receives a new solo topic entity and its `topicId` is set to that entity's id

#### Scenario: Migration does not duplicate already-migrated sessions
- **WHEN** the app loads and all sessions already have a `topicId`
- **THEN** no new topic entities are created and no existing data is modified

### Requirement: Topics list ordered by most recent session
The system SHALL return topics sorted by the `createdAt` timestamp of their most recent session, descending.

#### Scenario: Topics sorted by latest session date
- **WHEN** the dashboard requests all topics
- **THEN** the topic whose most recent session was created latest appears first

### Requirement: Topic entity aggregates session word metrics
The system SHALL aggregate total word count and unique word count across all sessions under a topic entity that possess `rawText`.

#### Scenario: Displaying aggregated topic word metrics
- **WHEN** topic sessions are retrieved for dashboard display
- **THEN** each topic includes computed `totalWords` and `uniqueWords` derived from all sessions within that topic containing valid `rawText`.
