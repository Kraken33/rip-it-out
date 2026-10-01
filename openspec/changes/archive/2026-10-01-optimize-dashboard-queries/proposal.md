# Proposal

## Why

When loading the Dashboard and Stats screens, the application triggers dozens of redundant, nested HTTP requests to Supabase (e.g. 40–120+ requests for normal accounts). This occurs because helper functions like `getTopicsWithSessions()`, `getSessionTime()`, `getTopicTime()`, and `getStats()` were originally written for synchronous in-memory `localStorage` access and call child functions (`getActivityLogs()`, `getSessions()`, `getTopic()`) inside nested loops over topics and sessions.

This results in high network latency, potential rate limiting, and slow page loads. We need to optimize data loading and aggregation across the store and dashboard so that loading screens fetches each table at most once and computes aggregated metrics in memory.

## What Changes

- **In-Memory Store Computation & Pure Aggregation Helpers**: Refactor `src/store.js` to separate table querying from metric aggregation (e.g. session times, topic times, word metrics, phrase counts, and review streak/due metrics) so that calculations are performed in-memory on pre-fetched collections instead of firing remote queries inside loops.
- **Batch / Aggregated Store Operations**:
  - Update `getTopicsWithSessions()` to fetch `topics`, `sessions`, `improvements`, and `activity_logs` in parallel once, resolving all child metrics without sub-queries.
  - Update `getStats()` to reuse cards and improvements without duplicate queries.
  - Introduce `getDashboardData()` (or parallelized single-fetch aggregation) for `Dashboard.jsx` and `Stats.jsx` to load all screen metrics with 0 redundant queries.
- **Deduplicated Due Cards Lookup**: Ensure SRS due card calculation does not re-fetch all cards when cards are already loaded.

## Capabilities

### Modified Capabilities
- `data-store`: Add requirement for efficient bulk data retrieval and in-memory aggregation without N+1 database queries when fetching topics, sessions, stats, and activity metrics.

## Impact

- `src/store.js`: Refactored aggregation functions (`getTopicsWithSessions`, `getTopicTime`, `getSessionTime`, `getStats`, `getActivityStats`) with helper functions that accept pre-fetched collections.
- `src/screens/Dashboard.jsx` and `src/screens/Stats.jsx`: Clean, single-pass data loading.
- `src/__tests__/store.test.js`, `src/__tests__/store.supabase.test.js`, `src/__tests__/Dashboard.test.jsx`, `src/__tests__/Stats.test.jsx`: Unit tests validating query efficiency and correctness.
- Database: No schema migrations or PostgREST RPC changes needed; remains 100% compatible with both Supabase and localStorage offline fallback.
