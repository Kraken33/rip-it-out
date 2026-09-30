# Data Store Specification

## Purpose
Manage local persistence for sessions, improvements, SRS cards, and backup export/import.

## Requirements

### Requirement: Local Storage Persistence
Store data reliably in localStorage with CRUD operations for sessions, topics, improvements, and SRS cards.
The system SHALL persist sessions, improvements, SRS cards, settings, AND topics in localStorage. Topic CRUD operations MUST be available: create, read by id, read all, and get-or-create by title.

#### Scenario: Session Creation
- **WHEN** a new session is created
- **THEN** it is saved to localStorage with a unique ID.

#### Scenario: Backup Import Modes
- **WHEN** importing a JSON backup file
- **THEN** merge mode appends non-duplicate records and replace mode overwrites all stores.

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

### Requirement: Session activity marker persisted on both storage backends

The system SHALL persist the session `activity` marker (`dialogue` or `translation`) on both localStorage and Supabase backends, and the Supabase `sessions` table schema SHALL provide an `activity` column so writes do not fail.

#### Scenario: Translation session persists to Supabase
- **WHEN** a session with `activity: 'translation'` is created while Supabase is configured
- **THEN** the insert succeeds and the session row is readable back with `activity` set to `translation`.

#### Scenario: Legacy sessions default to dialogue activity
- **WHEN** a session record without an `activity` value is read
- **THEN** it is treated as `activity: 'dialogue'`.

### Requirement: Graceful zero-row queries on Supabase
The data store SHALL use queries that return `null` instead of raising HTTP 406 Not Acceptable errors (PGRST116) when querying single records that may not exist in the database, including user settings and optional entity lookups.

#### Scenario: User settings query with no database row
- **WHEN** user settings are requested from Supabase for a user who has no settings record in the database
- **THEN** the store receives `null` for data without a PostgREST single-object coercion error (PGRST116) and falls back cleanly to default and local settings.

#### Scenario: Entity lookup by ID when entity does not exist in Supabase
- **WHEN** an individual entity (topic, session, improvement, or SRS card) is requested by ID that does not exist in the database
- **THEN** the store query returns `null` gracefully without throwing an HTTP 406 error.

