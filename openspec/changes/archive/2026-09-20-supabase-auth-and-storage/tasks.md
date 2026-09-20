# Tasks

## 1. Environment & Supabase Client Setup

- [x] 1.1 Install `@supabase/supabase-js` dependency and verify package installation in `package.json`
- [x] 1.2 Create `src/supabaseClient.js` client initialization file with environment variable configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and fallback detection
- [x] 1.3 Create SQL migration file `supabase/schema.sql` defining 6 tables (`topics`, `sessions`, `improvements`, `srs_cards`, `settings`, `activity_logs`), performance indexes on `user_id`, and `(select auth.uid())` RLS policies

## 2. Authentication System & Strict Access Gate

- [x] 2.1 Create `src/context/AuthContext.jsx` provider for authentication state, login, registration, logout, and session listener
- [x] 2.2 Create Auth screen component `src/screens/AuthScreen.jsx` with Tabbed Login and Registration forms, validation, and error feedback
- [x] 2.3 Integrate `AuthProvider` and strict authentication gate wrapper in `src/App.jsx` blocking unauthenticated users from accessing app screens

## 3. Supabase Storage Adapter

- [x] 3.1 Refactor `src/store.js` database operations to execute async CRUD queries against Supabase tables (`topics`, `sessions`, `improvements`, `srs_cards`, `settings`, `activity_logs`)

## 4. Screen Updates & Async UI Integration

- [x] 4.1 Update `src/screens/Dashboard.jsx` to fetch topics, sessions, stats, and word metrics asynchronously with loading spinners
- [x] 4.2 Update `src/screens/Session.jsx` and `src/screens/Practice.jsx` to save sessions, raw text, and improvements asynchronously to Supabase
- [x] 4.3 Update `src/screens/Review.jsx` and `src/screens/Library.jsx` to load and update SRS cards, topics, and improvements asynchronously
- [x] 4.4 Update `src/screens/Settings.jsx` and `src/screens/Stats.jsx` to read/update settings, activity logs, and export/import data asynchronously

## 5. Automated Testing & Verification

- [x] 5.1 Add unit tests for `AuthContext.jsx` and `AuthScreen.jsx` using Vitest and React Testing Library
- [x] 5.2 Add unit and integration tests for async `store.js` CRUD operations against Supabase client mock
- [x] 5.3 Run `npm run test` and `npm run build` to verify end-to-end test passing and build clean exit
