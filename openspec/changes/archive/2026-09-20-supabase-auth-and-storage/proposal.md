# Proposal

## Why

Currently, Rip It Out relies entirely on `localStorage` for data persistence, restricting users to a single browser on a single device with no account protection or cloud backup. Introducing Supabase provides multi-device cloud synchronization, robust database persistence with Row Level Security (RLS), and secure user authentication (registration and login).

## What Changes

- **Strict Authentication Access Gate**: Enforce strict user authentication. Users MUST sign up or log in before gaining access to any application features, screens, or dashboard.
- **New User Authentication System**: Implement registration, email/password login, session persistence, and logout flow using Supabase Auth.
- **Supabase Database Integration**: Migrate all entity stores (`topics`, `sessions`, `improvements`, `srs_cards`, `settings`, `activity_logs`) to Supabase PostgreSQL tables scoped to authenticated users.
- **No Data Migration**: Skip legacy `localStorage` data migration. Data storage starts fresh in Supabase upon user sign-up.
- **Async Store Layer**: Update internal storage interfaces to handle async database queries cleanly across all application screens.
- **BREAKING**: Unauthenticated users can no longer access application screens; all app entities are strictly scoped to authenticated Supabase user accounts.

## Capabilities

### New Capabilities
- `user-auth`: Provides user registration, login, logout, authentication state management, and strict access gating for unauthenticated users.

### Modified Capabilities
- `data-store`: Modifies persistence requirements from synchronous `localStorage` to async cloud-backed Supabase storage with Row Level Security.

## Impact

- **Dependencies**: Add `@supabase/supabase-js` package.
- **Codebase**: `src/store.js` replaced/refactored with Supabase client integration; new `src/context/AuthContext.jsx` and auth screens/view (`src/screens/AuthScreen.jsx`).
- **Data Security**: PostgreSQL Row Level Security policies enforce `user_id = (select auth.uid())` for all queries.
