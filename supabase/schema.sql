-- Schema Migration for Rip It Out Supabase PostgreSQL Database

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "topics_owner_access" ON public.topics;
CREATE POLICY "topics_owner_access" ON public.topics
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. Sessions Table
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
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'created'
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_owner_access" ON public.sessions;
CREATE POLICY "sessions_owner_access" ON public.sessions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Improvements Table
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
  context TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_improvements_user_id ON public.improvements(user_id);
ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "improvements_owner_access" ON public.improvements;
CREATE POLICY "improvements_owner_access" ON public.improvements
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. SRS Cards Table
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

DROP POLICY IF EXISTS "srs_cards_owner_access" ON public.srs_cards;
CREATE POLICY "srs_cards_owner_access" ON public.srs_cards
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  formality TEXT NOT NULL DEFAULT 'casual',
  level TEXT NOT NULL DEFAULT 'intermediate',
  focus_area TEXT NOT NULL DEFAULT 'all',
  max_improvements INT NOT NULL DEFAULT 5,
  practice_mode TEXT NOT NULL DEFAULT 'flashcard'
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_owner_access" ON public.settings;
CREATE POLICY "settings_owner_access" ON public.settings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. Activity Logs Table
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

DROP POLICY IF EXISTS "activity_logs_owner_access" ON public.activity_logs;
CREATE POLICY "activity_logs_owner_access" ON public.activity_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
