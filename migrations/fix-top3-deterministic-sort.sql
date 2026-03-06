-- Migration: Fix top 3 meals deterministic sort
-- When meals have equal votes, PostgreSQL returns them in arbitrary order.
-- This adds name ASC and id ASC as tiebreakers, matching the JS sortTopMeals logic.

-- Fix the standalone RPC
CREATE OR REPLACE FUNCTION public.get_top_voted_meals(request_uuid UUID)
RETURNS TABLE (
  meal_option_id UUID,
  yes_votes BIGINT,
  meal_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mo.id AS meal_option_id,
    COUNT(mv.id) FILTER (WHERE mv.vote = 'yes') AS yes_votes,
    mo.meal_data
  FROM public.meal_options mo
  LEFT JOIN public.meal_votes mv ON mv.meal_option_id = mo.id
  WHERE mo.request_id = request_uuid
  GROUP BY mo.id, mo.meal_data
  ORDER BY yes_votes DESC, (mo.meal_data->>'name') ASC, mo.id ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the load_user_dashboard RPC (top_meals subquery uses the same non-deterministic ORDER BY)
CREATE OR REPLACE FUNCTION public.load_user_dashboard()
RETURNS JSONB AS $$
DECLARE
  uid UUID := auth.uid();
  today_val DATE := CURRENT_DATE;
  result JSONB;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'profile', (
      SELECT row_to_json(p) FROM profiles p WHERE p.id = uid
    ),
    'groups', (
      SELECT COALESCE(jsonb_agg(g_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'group_id', g.id,
          'name', g.name,
          'description', g.description,
          'join_code', g.join_code,
          'created_by', g.created_by,
          'is_main_group', g.is_main_group,
          'created_at', g.created_at,
          'members', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'user_id', gm.user_id,
              'role', gm.role,
              'joined_at', gm.joined_at,
              'full_name', p.full_name,
              'display_name', p.display_name,
              'email', p.email
            ))
            FROM group_members gm
            LEFT JOIN profiles p ON p.id = gm.user_id
            WHERE gm.group_id = g.id AND gm.is_active = true
          ), '[]'::jsonb),
          'today_responses', COALESCE((
            SELECT jsonb_object_agg(dr.user_id, dr.response)
            FROM daily_responses dr
            WHERE dr.group_id = g.id AND dr.response_date = today_val
          ), '{}'::jsonb),
          'active_meal_request', (
            SELECT row_to_json(mr) FROM meal_requests mr
            WHERE mr.group_id = g.id AND mr.status = 'active'
            ORDER BY mr.created_at DESC LIMIT 1
          ),
          'top_meals', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'meal_option_id', top_data.meal_option_id,
                'yes_votes', top_data.yes_votes,
                'meal_data', top_data.meal_data
              )
            )
            FROM (
              SELECT mo.id AS meal_option_id,
                COUNT(mv.id) FILTER (WHERE mv.vote = 'yes')::bigint AS yes_votes,
                mo.meal_data
              FROM meal_options mo
              LEFT JOIN meal_votes mv ON mv.meal_option_id = mo.id
              WHERE mo.request_id = (
                SELECT mr.id FROM meal_requests mr WHERE mr.group_id = g.id AND mr.status = 'active' ORDER BY mr.created_at DESC LIMIT 1
              )
              GROUP BY mo.id, mo.meal_data
              ORDER BY yes_votes DESC, (mo.meal_data->>'name') ASC, mo.id ASC
              LIMIT 3
            ) top_data
          ), '[]'::jsonb)
        ) AS g_data
        FROM groups g
        WHERE g.is_active = true
        AND EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = g.id AND gm.user_id = uid AND gm.is_active = true
        )
        ORDER BY g.created_at DESC
      ) groups_sub
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
