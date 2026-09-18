# Spec Delta

## MODIFIED Requirements

### Requirement: Store data reliably in localStorage with CRUD operations for sessions, topics, improvements, and SRS cards
The system SHALL persist sessions, improvements, SRS cards, settings, AND topics in localStorage. Topic CRUD operations MUST be available: create, read by id, read all, and get-or-create by title.

#### Scenario: Topic is created and retrievable
- **WHEN** `createTopic` is called with a title
- **THEN** the topic is stored in localStorage and readable via `getTopic(id)`

#### Scenario: getOrCreateTopic returns existing topic for known title
- **WHEN** `getOrCreateTopic` is called with a title that already exists
- **THEN** the existing topic is returned and no new topic is created

#### Scenario: getOrCreateTopic creates new topic for unknown title
- **WHEN** `getOrCreateTopic` is called with a title that does not exist
- **THEN** a new topic is created, persisted, and returned

#### Scenario: All data collections survive export and import round-trip
- **WHEN** data is exported via `exportAllData` and re-imported via `importData`
- **THEN** the `topics` collection is included and restored correctly
