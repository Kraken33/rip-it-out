# Design

## Context

Rip It Out currently persists state in `localStorage`. We are introducing `@supabase/supabase-js` to handle authentication and remote database operations in PostgreSQL with Row Level Security (RLS). The application will enforce a strict auth wall: unauthenticated users cannot view or access any part of the application until they log in or register. Legacy data migration is explicitly skipped. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Enforce a strict authentication access gate (no access to app features without signing in).
- Provide email/password authentication (registration, login, logout, persistent session recovery).
- Provide a Supabase storage layer that mirrors all existing entities (`topics`, `sessions`, `improvements`, `srs_cards`, `settings`, `activity_logs`).
- Enforce user isolation via Row Level Security using `(select auth.uid()) = user_id`.

**Non-Goals:**
- Legacy `localStorage` data migration (skipped per requirement).
- Guest access / offline anonymous mode (all access requires an authenticated user account).

## Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              React App                                  |
|                                                                         |
|  +--------------------+    Is Authenticated?                            |
|  | AuthContext        | -----------------------+                        |
|  | (user, session,    |                        |                        |
|  |  loading state)    |            NO          v                        |
|  +---------+----------+            +-----------------------+            |
|            |                       | AuthScreen            |            |
|            | YES                   | (Login / Register)    |            |
|            v                       +-----------------------+            |
|  +--------------------+                                                 |
|  | Protected Layout   |                                                 |
|  | (Dashboard,        |                                                 |
|  |  Session, etc.)    |                                                 |
|  +---------+----------+                                                 |
|            |                                                            |
|            v                                                            |
|      supabaseClient.js (Supabase SDK)                                   |
+--------------+----------------------------------------------------------+
               |
               v Async API calls
+-------------------------------------------------------------------------+
|                            Supabase Cloud                               |
|                                                                         |
|  +-------------------------------+   +-------------------------------+  |
|  | Auth Service                  |   | PostgreSQL Database           |  |
|  | - Email/Password auth         |   | - RLS enabled                 |  |
|  | - JWT session management      |   | - 6 Tables (topics, sessions, |  |
|  |                               |   |   improvements, srs_cards,    |  |
|  |                               |   |   settings, activity_logs)    |  |
|  +-------------------------------+   +-------------------------------+  |
+-------------------------------------------------------------------------+
```

## Key Decisions & Best Practices

### Decision 1: Strict Auth Gate in `App.jsx`
- **Approach**: In `App.jsx`, read `user` and `loading` from `AuthContext`.
- If `loading`, display a sleek loading spinner.
- If `!user`, render `AuthScreen.jsx` exclusively (handling switching between Sign In and Sign Up tabs).
- If `user` exists, render the full app router and navigation headers with user avatar & logout button.

### Decision 2: Supabase JS SDK Initialization
- **Approach**: Instantiate Supabase client in `src/supabaseClient.js` using `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

### Decision 3: Database Schema, RLS, and Performance Indexes (Supabase Best Practices)
Adhering to Supabase security and performance guidelines:
- Use `(select auth.uid())` subqueries in RLS policies to prevent per-row function evaluation overhead.
- Use explicit `TO authenticated` roles.
- Create explicit B-tree indexes on `user_id` columns across all tables to optimize RLS evaluation.

Schema definition (`supabase/schema.sql`):
```sql
-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Topics
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_owner_access" ON public.topics
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  duration_seconds INT DEFAULT 0,
  raw_text TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'created'
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_owner_access" ON public.sessions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Improvements
CREATE TABLE IF NOT EXISTS public.improvements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
  construction TEXT NOT NULL,
  original TEXT NOT NULL,
  improved TEXT NOT NULL,
  explanation TEXT,
  category TEXT NOT NULL DEFAULT 'grammar',
  spoken_frequency TEXT NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_improvements_user_id ON public.improvements(user_id);
ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "improvements_owner_access" ON public.improvements
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- SRS Cards
CREATE TABLE IF NOT EXISTS public.srs_cards (
  improvement_id TEXT PRIMARY KEY REFERENCES public.improvements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_review TIMESTAMPTZ DEFAULT NULL,
  total_reviews INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_srs_cards_user_id ON public.srs_cards(user_id);
ALTER TABLE public.srs_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srs_cards_owner_access" ON public.srs_cards
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  formality TEXT NOT NULL DEFAULT 'casual',
  level TEXT NOT NULL DEFAULT 'intermediate',
  focus_area TEXT NOT NULL DEFAULT 'all',
  max_improvements INT NOT NULL DEFAULT 5,
  practice_mode TEXT NOT NULL DEFAULT 'flashcard'
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_owner_access" ON public.settings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  session_id TEXT REFERENCES public.sessions(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_owner_access" ON public.activity_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

### Decision 4: Async `store.js` Adapter
- **Approach**: Refactor `src/store.js` functions (`getTopics`, `createSession`, `getImprovements`, etc.) to execute async Supabase queries.

## Risks & Trade-offs

- **[Risk] Missing Supabase Credentials in Local Development**: Devs running without `.env` won't be able to log in or run tests.
  - *Mitigation*: Provide explicit `.env.example`, clear error state when Supabase credentials are missing, and mock auth/store provider for Vitest suite.
