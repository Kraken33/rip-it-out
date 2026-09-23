# Spec Delta

## ADDED Requirements

### Requirement: Session activity marker persisted on both storage backends

The system SHALL persist the session `activity` marker (`dialogue` or `translation`) on both localStorage and Supabase backends, and the Supabase `sessions` table schema SHALL provide an `activity` column so writes do not fail.

#### Scenario: Translation session persists to Supabase
- **WHEN** a session with `activity: 'translation'` is created while Supabase is configured
- **THEN** the insert succeeds and the session row is readable back with `activity` set to `translation`.

#### Scenario: Legacy sessions default to dialogue activity
- **WHEN** a session record without an `activity` value is read
- **THEN** it is treated as `activity: 'dialogue'`.
