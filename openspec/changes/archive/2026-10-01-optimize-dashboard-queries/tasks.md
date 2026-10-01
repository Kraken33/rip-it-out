# Tasks

## 1. Store Calculation Helpers & In-Memory Aggregations

- [x] 1.1 Extract pure synchronous calculation helpers in `src/store.js` (`calculateSessionTime`, `calculateTopicTime`, `calculateTopicWordMetrics`, `calculateStats`, `calculateActivityStats`, `calculateTodayWordMetrics`) and verify calculations via unit tests.
- [x] 1.2 Refactor `getTopicsWithSessions()` in `src/store.js` to fetch `topics`, `sessions`, `improvements`, and `activity_logs` in a single parallel batch and aggregate in memory without issuing loop queries; verify with store tests.
- [x] 1.3 Refactor `getStats()` and `getActivityStats()` to compute from in-memory collections without duplicate `srs_cards` or `sessions` fetches, and verify existing store tests pass.

## 2. Dashboard & Stats Screen Integration

- [x] 2.1 Refactor `Dashboard.jsx` data fetching to use consolidated, single-pass store retrieval and verify `Dashboard.test.jsx` passes.
- [x] 2.2 Refactor `Stats.jsx` data loading to avoid duplicate queries and verify `Stats.test.jsx` passes.

## 3. Verification & Regression Testing

- [x] 3.1 Run full Vitest test suite (`npm test`) to ensure all test files pass without regressions.
