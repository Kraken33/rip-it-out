# Spec Delta

## MODIFIED Requirements

### Requirement: Local Storage Persistence
The system SHALL persist sessions, topics, improvements, SRS cards, settings, and activity logs in Supabase PostgreSQL tables scoped to the authenticated user's ID using Row Level Security (RLS). Topic CRUD operations MUST be available: create, read by id, read all, and get-or-create by title.

#### Scenario: Session Creation
- **WHEN** a new session is created by an authenticated user
- **THEN** it is saved to Supabase with a unique ID associated with `auth.uid()`.

#### Scenario: Backup Import Modes
- **WHEN** importing a JSON backup file
- **THEN** merge mode appends non-duplicate records to Supabase and replace mode overwrites user data stores in Supabase.

#### Scenario: Topic is created and retrievable
- **WHEN** `createTopic` is called with a title
- **THEN** the topic is stored in Supabase and readable via `getTopic(id)` for the authenticated user.

#### Scenario: getOrCreateTopic returns existing topic for known title
- **WHEN** `getOrCreateTopic` is called with a title that already exists
- **THEN** the existing topic is returned and no new topic is created in Supabase.

#### Scenario: getOrCreateTopic creates new topic for unknown title
- **WHEN** `getOrCreateTopic` is called with a title that does not exist
- **THEN** a new topic is created, persisted in Supabase, and returned.

#### Scenario: All data collections survive export and import round-trip
- **WHEN** data is exported via `exportAllData` and re-imported via `importData`
- **THEN** the `topics` collection is included and restored correctly in Supabase.
