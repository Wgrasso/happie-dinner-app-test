-- Fix: "new row violates row-level security policy for table special_occasions"
-- Ensures authenticated users can create special occasions and add themselves as participants.
-- Run this in Supabase SQL Editor.

-- =============================================================================
-- 1. special_occasions - INSERT policy (creator can create)
-- =============================================================================
DROP POLICY IF EXISTS "Users can create occasions" ON public.special_occasions;
DROP POLICY IF EXISTS "Creator can insert occasion" ON public.special_occasions;

CREATE POLICY "Users can create occasions"
  ON public.special_occasions FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- =============================================================================
-- 2. special_occasion_participants - Allow creator to insert participants
--    (including themselves) when they create a new occasion.
-- =============================================================================
DROP POLICY IF EXISTS "Creators can manage participants" ON public.special_occasion_participants;

CREATE POLICY "Creators can manage participants"
  ON public.special_occasion_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.special_occasions
      WHERE id = special_occasion_participants.occasion_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.special_occasions
      WHERE id = special_occasion_participants.occasion_id AND creator_id = auth.uid()
    )
  );
