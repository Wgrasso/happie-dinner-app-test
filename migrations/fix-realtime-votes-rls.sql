-- Fix: Real-time Top 3 not updating when other users vote
-- Root cause: The SELECT RLS policy on meal_votes uses a complex 3-table JOIN
-- (meal_votes -> meal_requests -> group_members) which Supabase Realtime struggles
-- to evaluate efficiently for every subscriber on every change, causing events to
-- be silently dropped.
--
-- Solution: Replace with a SECURITY DEFINER helper that bypasses RLS recursion
-- and gives Realtime a fast, simple check to evaluate.
--
-- Run this in Supabase SQL Editor.

-- =============================================================================
-- 1. Helper: Check if a user belongs to the group that owns a meal_request
-- SECURITY DEFINER bypasses RLS, so Realtime can evaluate it quickly
-- =============================================================================
CREATE OR REPLACE FUNCTION public.user_is_request_member(
  check_request_id UUID,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meal_requests mr
    JOIN public.group_members gm
      ON gm.group_id = mr.group_id
      AND gm.user_id = COALESCE(check_user_id, auth.uid())
      AND gm.is_active = true
    WHERE mr.id = check_request_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================================================
-- 2. Replace the expensive meal_votes SELECT policy
-- Old policy: inline EXISTS with 3-table JOIN (breaks Realtime)
-- New policy: single function call (SECURITY DEFINER, fast for Realtime)
-- =============================================================================
DROP POLICY IF EXISTS "Members can read votes" ON public.meal_votes;

CREATE POLICY "Members can read votes"
  ON public.meal_votes FOR SELECT
  USING (public.user_is_request_member(request_id));

-- =============================================================================
-- 3. Also fix meal_options SELECT policy (same pattern)
-- =============================================================================
DROP POLICY IF EXISTS "Members can read meal options" ON public.meal_options;

CREATE POLICY "Members can read meal options"
  ON public.meal_options FOR SELECT
  USING (public.user_is_request_member(request_id));

-- =============================================================================
-- 4. Ensure meal_votes is in the supabase_realtime publication
-- (safe to re-run; skips if already present)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meal_votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_votes;
  END IF;
END $$;

-- =============================================================================
-- 5. Grant execute on the new helper to authenticated users
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.user_is_request_member(UUID, UUID) TO authenticated;
