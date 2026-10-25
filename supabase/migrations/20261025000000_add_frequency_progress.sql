-- Migration: Add frequency_progress table for cross-device sync of Manythings frequency practice
CREATE TABLE IF NOT EXISTS public.frequency_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INT NOT NULL DEFAULT 1,
  sentence_index INT NOT NULL DEFAULT 0,
  completed_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  saved_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.frequency_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "frequency_progress_owner_access" ON public.frequency_progress;
CREATE POLICY "frequency_progress_owner_access" ON public.frequency_progress
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
