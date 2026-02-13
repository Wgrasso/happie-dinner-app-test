-- Fix: Top 3 and Special Occasions not showing
-- Likely cause: RLS recursion between special_occasions and special_occasion_participants
-- (similar to the group_members fix). Also ensure RPC functions have correct privileges.
-- Run this in Supabase SQL Editor.

-- =============================================================================
-- 1. SPECIAL OCCASIONS - Fix recursion between special_occasions and special_occasion_participants
-- =============================================================================

-- Helper: SECURITY DEFINER bypasses RLS, breaks recursion
CREATE OR REPLACE FUNCTION public.user_can_access_occasion(check_occasion_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.special_occasions
    WHERE id = check_occasion_id AND creator_id = COALESCE(check_user_id, auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.special_occasion_participants
    WHERE occasion_id = check_occasion_id AND user_id = COALESCE(check_user_id, auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Drop old policies
DROP POLICY IF EXISTS "Participants can read" ON public.special_occasion_participants;
DROP POLICY IF EXISTS "Creator and participants can read occasions" ON public.special_occasions;
DROP POLICY IF EXISTS "Participants can read responses" ON public.special_occasion_responses;
DROP POLICY IF EXISTS "Participants can respond" ON public.special_occasion_responses;
DROP POLICY IF EXISTS "Participants can read occasion meals" ON public.occasion_meal_options;
DROP POLICY IF EXISTS "Participants can manage occasion votes" ON public.occasion_meal_votes;

-- Recreate with helper (no recursion)
CREATE POLICY "Participants can read"
  ON public.special_occasion_participants FOR SELECT
  USING (public.user_can_access_occasion(occasion_id));

CREATE POLICY "Creator and participants can read occasions"
  ON public.special_occasions FOR SELECT
  USING (public.user_can_access_occasion(id));

CREATE POLICY "Participants can read responses"
  ON public.special_occasion_responses FOR SELECT
  USING (public.user_can_access_occasion(occasion_id));

CREATE POLICY "Participants can respond"
  ON public.special_occasion_responses FOR ALL
  USING (
    user_id = auth.uid() AND
    public.user_can_access_occasion(occasion_id)
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can read occasion meals"
  ON public.occasion_meal_options FOR SELECT
  USING (public.user_can_access_occasion(occasion_id));

CREATE POLICY "Participants can manage occasion votes"
  ON public.occasion_meal_votes FOR ALL
  USING (
    user_id = auth.uid() AND
    public.user_can_access_occasion(occasion_id)
  )
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 2. TOP 3 (meal_votes, meal_options) - Use group_members helper if not already
-- Ensure meal tables can be read by group members (via user_is_group_member)
-- =============================================================================

-- Ensure user_is_group_member exists (from fix-group-members-recursion.sql)
CREATE OR REPLACE FUNCTION public.user_is_group_member(check_group_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = check_group_id AND user_id = COALESCE(check_user_id, auth.uid()) AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute to authenticated for RPCs (Top 3 uses get_top_voted_meals)
GRANT EXECUTE ON FUNCTION public.get_top_voted_meals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_meal_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.load_user_dashboard() TO authenticated;

-- =============================================================================
-- 3. Realtime for occasion tables (ensure they're in publication)
-- =============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['occasion_meal_votes', 'occasion_meal_options'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
