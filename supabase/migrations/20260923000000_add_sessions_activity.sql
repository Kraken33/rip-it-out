-- Add the session activity marker ('dialogue' | 'translation') so translation
-- story sessions persist to Supabase instead of failing the insert.
-- Idempotent: safe to re-run.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS activity TEXT NOT NULL DEFAULT 'dialogue';
