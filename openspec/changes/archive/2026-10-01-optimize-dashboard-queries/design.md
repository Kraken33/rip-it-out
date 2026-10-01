# Design

## Context

See `proposal.md` for motivation. Currently, `src/store.js` implements entity operations against both Supabase and localStorage. Aggregation functions like `getTopicsWithSessions()`, `getSessionTime()`, and `getTopicTime()` issue separate DB queries on every iteration. On dashboard and stats pages, this cascades into 40–120+ network requests per page load.

## Goals / Non-Goals

**Goals:**
- Eliminate all $N+1$ database query loops in `src/store.js`.
- Reduce Dashboard and Stats initial loads to 1 single fetch per required table (maximum 5 queries total for the entire page load).
- Maintain 100% backward compatibility with existing function signatures and test suites.
- Keep offline localStorage compatibility identical to Supabase behavior.

**Non-Goals:**
- Creating Supabase Postgres server-side functions / RPCs or database schema migrations.
- Adding client-side caching libraries (like React Query or SWR) at this time.

## Decisions

### Decision 1: Extract pure synchronous computation helpers

We will separate data fetching from data calculation:
- `calculateSessionTime(session, activityLogs)`
- `calculateTopicTime(topic, sessions, activityLogs)`
- `calculateTopicWordMetrics(sessions)`
- `calculateStats({ improvements, cards, dueCards, sessions })`
- `calculateActivityStats(activityLogs)`

Public async functions (`getSessionTime`, `getTopicTime`, `getTopicWordMetrics`, `getStats`, `getActivityStats`) will fetch missing dependencies if called standalone, but delegate calculation to these pure functions.

*Alternative considered*: Keeping queries inside helpers. Rejected because it forces $N+1$ loops whenever composing data structures.

### Decision 2: Single-pass bulk retrieval in `getTopicsWithSessions()`

`getTopicsWithSessions()` will fetch:
```javascript
const [topics, allSessions, improvements, logs] = await Promise.all([
  getTopics(),
  getSessions(),
  getImprovements(),
  getActivityLogs(),
]);
```
It will then build lookup maps (`sessionMap`, `logsBySessionId`, `logsByTopicId`, `improvementsBySessionId`) and synchronously enrich each topic and session in-memory using the calculation helpers.

*Impact*: Drops `getTopicsWithSessions()` query count from $3 + 2S + 4T$ down to exactly **4 queries**.

### Decision 3: Unified Dashboard & Stats data retrieval

- In `Dashboard.jsx`, provide `getDashboardData()` or run deduplicated data loading so `topics`, `sessions`, `improvements`, `srsCards`, `activityLogs` are fetched once in parallel, and all widgets (Time Spent widget, Due SRS counts, Words Today, Topics list) are computed synchronously from that single dataset.
- In `Stats.jsx`, ensure `getActivityStats`, `getTopicsWithSessions`, `getActivityLogs`, and `getAllTimeWordMetrics` share the same base dataset without redundant queries.

## Risks / Trade-offs

- **[Risk] High volume of historical activity logs or sessions in memory** → *Mitigation*: The app is currently single-user client side with small-to-medium dataset sizes (hundreds to low thousands of records). In-memory processing is sub-millisecond in JS. If dataset sizes reach tens of thousands in the future, server-side pagination/RPC can be introduced.
- **[Risk] Existing tests mocking specific store calls** → *Mitigation*: Ensure exported functions preserve their signatures and return values so all 264 existing unit/integration tests continue passing.

## Migration Plan

1. Refactor store calculation functions and `getTopicsWithSessions()`.
2. Update `Dashboard.jsx` and `Stats.jsx` loading hooks.
3. Validate with unit tests for `store`, `Dashboard`, and `Stats`.
