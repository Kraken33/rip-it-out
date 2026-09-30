# Tasks

## 1. Update Supabase Read Queries in Store

- [x] 1.1 Replace `.single()` with `.maybeSingle()` in `getSettings()` within `src/store.js` and verify zero-row database response returns default settings without error
- [x] 1.2 Replace `.single()` with `.maybeSingle()` in `getTopic()`, `getSession()`, `getImprovement()`, and `getSrsCard()` in `src/store.js` and verify null is returned for missing entities

## 2. Update Tests and Verification

- [x] 2.1 Update Supabase query mocks in `src/__tests__/store.test.js` to support `.maybeSingle()` and verify test suite passes with `npm test`
