# Proposal

## Why

When querying Supabase with `.single()`, PostgREST responds with `HTTP 406 Not Acceptable` (`PGRST116: "Cannot coerce the result to a single JSON object"`) whenever 0 rows match. For operations like fetching user settings for new users or looking up optional records (topics, sessions, improvements, SRS cards by id), 0 matching rows is a normal and expected state. These 406 errors pollute network logs and console warnings across the application.

## What Changes

- Update Supabase queries in `src/store.js` that retrieve individual records that may not exist (e.g. `getSettings`, `getTopic`, `getSession`, `getImprovement`, `getSrsCard`) to use `.maybeSingle()` instead of `.single()`.
- Ensure `getSettings()` cleanly falls back to default settings without throwing or logging PostgREST 406 errors when a user does not have a database row yet.
- Update tests in `src/__tests__/store.test.js` to verify that `.maybeSingle()` is used and handles 0 rows / `null` responses gracefully.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `data-store`: Update Supabase querying requirements to ensure single-record lookups handle zero-row states gracefully using `.maybeSingle()` without generating 406 errors.

## Impact

- `src/store.js`: Changes Supabase query methods from `.single()` to `.maybeSingle()` for single-entity fetch functions.
- `src/__tests__/store.test.js`: Unit tests for store operations and Supabase mocks.
