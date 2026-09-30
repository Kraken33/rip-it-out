# Spec Delta

## ADDED Requirements

### Requirement: Graceful zero-row queries on Supabase
The data store SHALL use queries that return `null` instead of raising HTTP 406 Not Acceptable errors (PGRST116) when querying single records that may not exist in the database, including user settings and optional entity lookups.

#### Scenario: User settings query with no database row
- **WHEN** user settings are requested from Supabase for a user who has no settings record in the database
- **THEN** the store receives `null` for data without a PostgREST single-object coercion error (PGRST116) and falls back cleanly to default and local settings.

#### Scenario: Entity lookup by ID when entity does not exist in Supabase
- **WHEN** an individual entity (topic, session, improvement, or SRS card) is requested by ID that does not exist in the database
- **THEN** the store query returns `null` gracefully without throwing an HTTP 406 error.
