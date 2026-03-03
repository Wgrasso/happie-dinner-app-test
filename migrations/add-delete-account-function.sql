-- Account deletion helper for App Store compliance.
-- Run in Supabase SQL editor before deploying the delete-account edge function.

CREATE OR REPLACE FUNCTION public.delete_user_account_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Remove memberships and user-owned content first.
  IF to_regclass('public.group_members') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.group_members WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.daily_responses') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.daily_responses WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.dinner_requests') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.dinner_requests WHERE requester_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.dinner_request_responses') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.dinner_request_responses WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.meal_votes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.meal_votes WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.wishlist') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.wishlist WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.user_recipes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_recipes WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.special_occasions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.special_occasions WHERE creator_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.special_occasion_participants') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.special_occasion_participants WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.special_occasion_responses') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.special_occasion_responses WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.occasion_meal_votes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.occasion_meal_votes WHERE user_id = $1' USING p_user_id;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.profiles WHERE id = $1' USING p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO service_role;
