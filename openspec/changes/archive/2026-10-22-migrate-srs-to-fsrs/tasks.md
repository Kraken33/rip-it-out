# Tasks

## 1. Dependency & Core FSRS Engine

- [x] 1.1 Install `ts-fsrs` via npm and verify clean package installation in `package.json`
- [x] 1.2 Implement FSRS scheduler instance and card conversion adapters (`toFsrsCard`, `fromFsrsCard`, state/rating mapping) in `src/srs.js`
- [x] 1.3 Refactor `processReview` in `src/srs.js` to use `ts-fsrs` with short-term learning steps (`1m`, `10m`) and verify unit tests pass in `src/__tests__/srs.test.js`

## 2. Store & Persistence Adaptation

- [x] 2.1 Update `createSrsCard` and `updateSrsCard` in `src/store.js` to persist FSRS fields (`stability`, `difficulty`, `state`, `due`) alongside legacy fallback fields
- [x] 2.2 Update `getDueCards` and `calculateDueCards` in `src/store.js` to accurately evaluate intraday due cards
- [x] 2.3 Update `saveFrequencySentenceToSrs` in `src/store.js` so saved sentences enter `State.New` without forcing immediate 24-hour lockout
- [x] 2.4 Verify store persistence, mapping, and backward-compatibility in `src/__tests__/store.test.js` and `src/__tests__/store.supabase.test.js`

## 3. UI Review & Queue Integration

- [x] 3.1 Update `src/screens/Review.jsx` to handle in-session `Again` (1m step) and accurate status presentation
- [x] 3.2 Update `src/screens/Library.jsx` badges and filter logic to support FSRS states and human-readable intraday due labels
- [x] 3.3 Update `src/__tests__/Review.test.jsx`, `src/__tests__/Practice.test.jsx`, and `src/__tests__/Library.test.jsx` to verify updated review workflows

## 4. System Verification & Build

- [x] 4.1 Execute complete unit test suite (`npm test`) and verify 100% test pass rate
- [x] 4.2 Build production distribution bundle (`npm run build`) and verify build succeeds
