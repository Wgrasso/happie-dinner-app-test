-- Fix: "infinite recursion detected in policy for relation group_members"
-- Run this in Supabase SQL Editor if you see that error.
-- The issue: group_members policies queried group_members, causing RLS recursion.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Members can read group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;

-- 2. Create helper functions (SECURITY DEFINER bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.user_is_group_member(check_group_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = check_group_id AND user_id = COALESCE(check_user_id, auth.uid()) AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_is_group_admin(check_group_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = check_group_id AND user_id = COALESCE(check_user_id, auth.uid()) AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Recreate policies using the helpers
CREATE POLICY "Members can read group members"
  ON public.group_members FOR SELECT
  USING (public.user_is_group_member(group_id));

CREATE POLICY "Admins can manage members"
  ON public.group_members FOR ALL
  USING (public.user_is_group_admin(group_id));
