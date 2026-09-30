# Design

## Context

See `proposal.md` for motivation. Currently, [src/store.js](file:///Users/vanluv/develop/rip-it-out/src/store.js) invokes `.single()` on PostgREST queries when fetching user settings (`getSettings`) as well as individual entities (`getTopic`, `getSession`, `getImprovement`, `getSrsCard`).

PostgREST's `.single()` method sets the request header `Accept: application/vnd.pgrst.object+json`. If 0 rows are returned, PostgREST returns `HTTP 406 Not Acceptable` with error code `PGRST116` (`"Cannot coerce the result to a single JSON object"`).

## Goals / Non-Goals

**Goals:**
- Replace `.single()` with `.maybeSingle()` on all read queries in [src/store.js](file:///Users/vanluv/develop/rip-it-out/src/store.js) where 0 rows is a valid response (specifically `getSettings`, `getTopic`, `getSession`, `getImprovement`, `getSrsCard`).
- Ensure unit tests in `src/__tests__/store.test.js` accurately mock and verify `.maybeSingle()` queries and zero-row handling.

**Non-Goals:**
- Altering `.insert().select().single()` or `.update().select().single()` where an updated/inserted row is strictly expected to exist unless an error occurred.
- Modifying Postgres schema or adding server-side database triggers.

## Decisions

### Decision 1: Use `.maybeSingle()` instead of `.single()` for read queries
- **Rationale**: `.maybeSingle()` uses `Accept: application/json` with `limit 1`. When 0 rows match, PostgREST returns `200 OK` with `[]` which the Supabase client transforms into `{ data: null, error: null }`. This eliminates 406 HTTP errors and console warnings.
- **Alternatives Considered**:
  - *Keep `.single()` and catch/filter `PGRST116` error*: Still incurs a 406 HTTP network error visible in the browser network inspector.
  - *Use `.limit(1)` and check array*: Extra boilerplate mapping `data[0] || null` compared to the built-in `.maybeSingle()`.

### Decision 2: Retain `.single()` on mutation return values (`insert(...).select().single()`)
- **Rationale**: When inserting or updating a record in Supabase, exactly 1 row is expected in response. If an insert fails or returns no rows, an error is appropriate.

## Risks / Trade-offs

- **[Risk]**: Unit test mocks in `src/__tests__/store.test.js` may still mock `.single()` instead of `.maybeSingle()`.
  - **Mitigation**: Update all mock query builders in `src/__tests__/store.test.js` to support `.maybeSingle()` returning appropriate data/null.
