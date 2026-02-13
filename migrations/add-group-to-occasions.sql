-- =============================================================================
-- Migration: Fix occasion creation RLS + add group support
-- Fixes RLS violation on INSERT by using SECURITY DEFINER RPC.
-- Adds group_id column and group-linking support.
-- =============================================================================

-- =============================================================================
-- STEP 1: Fix all occasion RLS policies (clean slate approach)
-- =============================================================================

-- Helper: check if user is occasion creator (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_is_occasion_creator(
  check_occasion_id UUID,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.special_occasions
    WHERE id = check_occasion_id
      AND creator_id = COALESCE(check_user_id, auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.user_is_occasion_creator(UUID, UUID) TO authenticated;

-- Drop ALL existing INSERT policies on special_occasions to start clean
DROP POLICY IF EXISTS "Users can create occasions" ON public.special_occasions;
DROP POLICY IF EXISTS "Creator can insert occasion" ON public.special_occasions;
DROP POLICY IF EXISTS "Creators can create occasions" ON public.special_occasions;

-- Recreate INSERT policy
CREATE POLICY "Users can create occasions"
  ON public.special_occasions FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Fix participants policies (uses SECURITY DEFINER helper to avoid recursion)
DROP POLICY IF EXISTS "Creators can manage participants" ON public.special_occasion_participants;
CREATE POLICY "Creators can manage participants"
  ON public.special_occasion_participants FOR ALL
  TO authenticated
  USING (
    public.user_is_occasion_creator(occasion_id)
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.user_is_occasion_creator(occasion_id)
    OR user_id = auth.uid()
  );

-- Explicit self-leave policy (user can always delete their own participant row)
DROP POLICY IF EXISTS "Users can leave occasion (delete own participant row)" ON public.special_occasion_participants;
CREATE POLICY "Users can leave occasion (delete own participant row)"
  ON public.special_occasion_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- STEP 2: RPC to create occasion (SECURITY DEFINER = bypasses ALL RLS)
-- This is the primary way the app creates occasions - guaranteed to work.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_special_occasion(
  p_occasion_type TEXT,
  p_occasion_date DATE,
  p_occasion_message TEXT DEFAULT NULL,
  p_occasion_time TIME DEFAULT NULL,
  p_deadline TIMESTAMPTZ DEFAULT NULL,
  p_group_ids UUID[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_occasion_id UUID;
  v_deadline TIMESTAMPTZ;
  v_gid UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_deadline := COALESCE(p_deadline, (p_occasion_date::TEXT || 'T23:59:00+00:00')::TIMESTAMPTZ);

  -- Insert the occasion
  INSERT INTO public.special_occasions (
    creator_id, occasion_type, occasion_message, occasion_date,
    occasion_time, deadline, status, voting_enabled
  ) VALUES (
    v_user_id, p_occasion_type, p_occasion_message, p_occasion_date,
    p_occasion_time, v_deadline, 'pending', false
  )
  RETURNING id INTO v_occasion_id;

  -- Add creator as participant
  INSERT INTO public.special_occasion_participants (occasion_id, user_id)
  VALUES (v_occasion_id, v_user_id)
  ON CONFLICT DO NOTHING;

  -- Add group members for each selected group
  IF p_group_ids IS NOT NULL AND array_length(p_group_ids, 1) > 0 THEN
    FOREACH v_gid IN ARRAY p_group_ids LOOP
      -- Add all active group members as participants
      INSERT INTO public.special_occasion_participants (occasion_id, user_id)
      SELECT v_occasion_id, gm.user_id
      FROM public.group_members gm
      WHERE gm.group_id = v_gid AND gm.is_active = true
      ON CONFLICT (occasion_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'success', true,
    'occasion_id', v_occasion_id,
    'creator_id', v_user_id,
    'occasion_type', p_occasion_type,
    'occasion_date', p_occasion_date
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_special_occasion(TEXT, DATE, TEXT, TIME, TIMESTAMPTZ, UUID[]) TO authenticated;

-- =============================================================================
-- STEP 2b: RPC to leave occasion (SECURITY DEFINER = bypasses RLS)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.leave_special_occasion(p_occasion_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_creator UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Prevent creator from leaving - they must delete instead
  SELECT creator_id INTO v_creator
  FROM public.special_occasions
  WHERE id = p_occasion_id;

  IF v_creator = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Je bent de maker van dit moment. Gebruik verwijderen in plaats van verlaten.');
  END IF;

  -- Delete participant row
  DELETE FROM public.special_occasion_participants
  WHERE occasion_id = p_occasion_id AND user_id = v_user_id;

  -- Also delete any response
  DELETE FROM public.special_occasion_responses
  WHERE occasion_id = p_occasion_id AND user_id = v_user_id;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.leave_special_occasion(UUID) TO authenticated;

-- =============================================================================
-- STEP 2c: Delete policy - only creators can delete their occasions
-- =============================================================================
DROP POLICY IF EXISTS "Creators can delete occasions" ON public.special_occasions;
CREATE POLICY "Creators can delete occasions"
  ON public.special_occasions FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- =============================================================================
-- STEP 2d: RPC to delete occasion (SECURITY DEFINER = bypasses RLS)
-- Only the creator can delete. CASCADE on FK handles participants/responses.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.delete_special_occasion(p_occasion_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_creator UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check ownership
  SELECT creator_id INTO v_creator
  FROM public.special_occasions
  WHERE id = p_occasion_id;

  IF v_creator IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Occasion not found');
  END IF;

  IF v_creator != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Only the creator can delete this occasion');
  END IF;

  -- Delete occasion (CASCADE takes care of participants, responses, meal_options, meal_votes, occasion_groups)
  DELETE FROM public.special_occasions WHERE id = p_occasion_id;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_special_occasion(UUID) TO authenticated;

-- =============================================================================
-- STEP 3: Add group_id column (optional, for future queries)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'special_occasions'
      AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.special_occasions
      ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_special_occasions_group
  ON public.special_occasions(group_id)
  WHERE group_id IS NOT NULL;

-- =============================================================================
-- STEP 4: Junction table for multi-group support
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.occasion_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occasion_id UUID NOT NULL REFERENCES public.special_occasions(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(occasion_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_occasion_groups_occasion ON public.occasion_groups(occasion_id);
CREATE INDEX IF NOT EXISTS idx_occasion_groups_group ON public.occasion_groups(group_id);

ALTER TABLE public.occasion_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view occasion groups" ON public.occasion_groups;
CREATE POLICY "Users can view occasion groups" ON public.occasion_groups
  FOR SELECT USING (
    public.user_is_occasion_creator(occasion_id)
    OR EXISTS (
      SELECT 1 FROM public.special_occasion_participants p
      WHERE p.occasion_id = occasion_groups.occasion_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators can manage occasion groups" ON public.occasion_groups;
CREATE POLICY "Creators can manage occasion groups" ON public.occasion_groups
  FOR ALL USING (public.user_is_occasion_creator(occasion_id));

GRANT SELECT, INSERT, DELETE ON public.occasion_groups TO authenticated;
