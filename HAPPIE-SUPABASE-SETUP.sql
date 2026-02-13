-- =============================================================================
-- HAPPIE DINNER - SUPABASE SETUP
-- Single SQL file for direct connection to the app
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- Organized by app function for clarity and maintainability
--
-- APP FUNCTION -> TABLES
-- 1. Profiles     -> profiles (auth trigger)
-- 2. Groups       -> groups, group_members
-- 3. Daily Yes/No -> daily_responses (REALTIME)
-- 4. Dinner       -> dinner_requests, dinner_request_responses
-- 5. Recipes      -> recipes
-- 6. Meal Voting  -> meal_requests, meal_options, meal_votes (REALTIME)
-- 7. Wishlist     -> wishlist
-- 8. Occasions    -> special_occasions, _participants, _responses (REALTIME)
-- 9. History      -> terminated_sessions
-- 10. Realtime    -> meal_votes, daily_responses, special_occasions, etc.
-- 11. Fast Load   -> load_user_dashboard() RPC
-- =============================================================================

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES (Auth + User Data)
-- Used by: SignIn, Profile, all screens for user info
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'nl',
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for avatars (run in Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- 2. GROUPS
-- Used by: Groups screen, create/join/leave group
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_main_group BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2b. GROUP MEMBERS (must exist before groups policies that reference it)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Drop policies that cause recursion (safe to re-run)
DROP POLICY IF EXISTS "Members can read group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;

-- Helper: bypasses RLS to avoid infinite recursion when policies check group_members
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

CREATE POLICY "Members can read group members"
  ON public.group_members FOR SELECT
  USING (public.user_is_group_member(group_id));

CREATE POLICY "Admins can manage members"
  ON public.group_members FOR ALL
  USING (public.user_is_group_admin(group_id));

CREATE POLICY "Users can join via insert"
  ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave (delete own membership)"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id) WHERE is_active = true;

-- Groups RLS and policies (after group_members exists)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_active = true
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Creators can insert groups"
  ON public.groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update own groups"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete own groups"
  ON public.groups FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can delete empty groups (orphan cleanup)"
  ON public.groups FOR DELETE
  USING (
    NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND is_active = true)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code) WHERE is_active = true;

-- =============================================================================
-- 3. DAILY RESPONSES (Yes/No dinner today)
-- REALTIME: Critical - updates when anyone taps Yes/No
-- Used by: Groups screen collapsed/expanded cards
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.daily_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_date DATE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id, response_date)
);

ALTER TABLE public.daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group responses"
  ON public.daily_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = daily_responses.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can upsert own response"
  ON public.daily_responses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_daily_responses_group_date ON public.daily_responses(group_id, response_date);

-- =============================================================================
-- 4. DINNER REQUESTS
-- Used by: MainProfile (send request), Groups (display active request)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dinner_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  request_time TIME,
  deadline TIMESTAMPTZ NOT NULL,
  deadline_time TEXT,
  recipe_type TEXT DEFAULT 'voting',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  occasion_type TEXT,
  occasion_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dinner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group dinner requests"
  ON public.dinner_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = dinner_requests.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Members can create dinner requests"
  ON public.dinner_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = dinner_requests.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Requesters can update own requests"
  ON public.dinner_requests FOR UPDATE
  USING (requester_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dinner_requests_group_status ON public.dinner_requests(group_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_dinner_requests_group_date ON public.dinner_requests(group_id, request_date);

-- dinner_request_responses (yes/no per specific dinner request)
CREATE TABLE IF NOT EXISTS public.dinner_request_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.dinner_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, user_id)
);

ALTER TABLE public.dinner_request_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read dinner request responses"
  ON public.dinner_request_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dinner_requests dr
      JOIN public.group_members gm ON gm.group_id = dr.group_id AND gm.user_id = auth.uid() AND gm.is_active = true
      WHERE dr.id = dinner_request_responses.request_id
    )
  );

CREATE POLICY "Users can respond to dinner requests"
  ON public.dinner_request_responses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 5. RECIPES (Ideas screen + meal voting)
-- Used by: IdeasScreen, meal_options (linked via recipe_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  cooking_time_minutes INT,
  cuisine_type TEXT,
  ingredients TEXT[],
  steps TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipes are readable by authenticated users"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage recipes"
  ON public.recipes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: Seed recipes for voting (skip if you have your own)
INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type)
SELECT 'Pasta Carbonara', 'Classic Italian pasta with creamy egg sauce', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', 25, 'Italian'
WHERE NOT EXISTS (SELECT 1 FROM public.recipes LIMIT 1);
INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type)
SELECT 'Grilled Salmon', 'Fresh salmon with herbs and lemon', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', 20, 'Seafood'
WHERE (SELECT COUNT(*) FROM public.recipes) < 2;
INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type)
SELECT 'Vegetable Stir Fry', 'Colorful vegetables in a savory sauce', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', 15, 'Asian'
WHERE (SELECT COUNT(*) FROM public.recipes) < 3;
INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type)
SELECT 'Chicken Curry', 'Aromatic curry with tender chicken', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 35, 'Indian'
WHERE (SELECT COUNT(*) FROM public.recipes) < 4;
INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type)
SELECT 'Caesar Salad', 'Crisp romaine with parmesan and croutons', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 15, 'American'
WHERE (SELECT COUNT(*) FROM public.recipes) < 5;

-- =============================================================================
-- 6. MEAL REQUESTS & VOTING
-- REALTIME: meal_votes - Top 3 updates when anyone swipes
-- Used by: Voting screen, Groups screen Top 3 section
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.meal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipe_type TEXT DEFAULT 'voting',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group meal requests"
  ON public.meal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = meal_requests.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Members can create meal requests"
  ON public.meal_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = meal_requests.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_meal_requests_group_status ON public.meal_requests(group_id, status) WHERE status = 'active';

-- meal_options: links meal_requests to recipes, stores vote tally
CREATE TABLE IF NOT EXISTS public.meal_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.meal_requests(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_data JSONB,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meal_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read meal options"
  ON public.meal_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_requests mr
      JOIN public.group_members gm ON gm.group_id = mr.group_id AND gm.user_id = auth.uid() AND gm.is_active = true
      WHERE mr.id = meal_options.request_id
    )
  );

CREATE POLICY "Group members can manage meal options"
  ON public.meal_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_requests mr
      JOIN public.group_members gm ON gm.group_id = mr.group_id AND gm.user_id = auth.uid() AND gm.is_active = true
      WHERE mr.id = meal_options.request_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_requests mr
      JOIN public.group_members gm ON gm.group_id = mr.group_id AND gm.user_id = auth.uid() AND gm.is_active = true
      WHERE mr.id = meal_options.request_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_meal_options_request ON public.meal_options(request_id);

-- meal_votes: REALTIME - each swipe inserts/updates
CREATE TABLE IF NOT EXISTS public.meal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.meal_requests(id) ON DELETE CASCADE,
  meal_option_id UUID NOT NULL REFERENCES public.meal_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, user_id, meal_option_id)
);

ALTER TABLE public.meal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read votes"
  ON public.meal_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_requests mr
      JOIN public.group_members gm ON gm.group_id = mr.group_id AND gm.user_id = auth.uid() AND gm.is_active = true
      WHERE mr.id = meal_votes.request_id
    )
  );

CREATE POLICY "Users can vote"
  ON public.meal_votes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_meal_votes_request ON public.meal_votes(request_id);

-- =============================================================================
-- 7. WISHLIST (Ideas screen - save recipes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  recipe_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlist FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);

-- =============================================================================
-- 8. SPECIAL OCCASIONS
-- REALTIME: special_occasions, special_occasion_participants, special_occasion_responses
-- Used by: MainProfile (create), Groups (display, respond)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.special_occasions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion_type TEXT NOT NULL,
  occasion_message TEXT,
  occasion_date DATE NOT NULL,
  occasion_time TIME,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  voting_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- special_occasion_participants (must exist before special_occasions policies that reference it)
CREATE TABLE IF NOT EXISTS public.special_occasion_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occasion_id UUID NOT NULL REFERENCES public.special_occasions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(occasion_id, user_id)
);

ALTER TABLE public.special_occasion_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read"
  ON public.special_occasion_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.special_occasions so
      WHERE so.id = special_occasion_participants.occasion_id
      AND (so.creator_id = auth.uid() OR special_occasion_participants.user_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage participants"
  ON public.special_occasion_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.special_occasions
      WHERE id = special_occasion_participants.occasion_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave occasion (delete own participant row)"
  ON public.special_occasion_participants FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sop_occasion ON public.special_occasion_participants(occasion_id);
CREATE INDEX IF NOT EXISTS idx_sop_user ON public.special_occasion_participants(user_id);

-- special_occasions RLS and policies (after special_occasion_participants exists)
ALTER TABLE public.special_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator and participants can read occasions"
  ON public.special_occasions FOR SELECT
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.special_occasion_participants
      WHERE occasion_id = special_occasions.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create occasions"
  ON public.special_occasions FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update occasions"
  ON public.special_occasions FOR UPDATE
  USING (creator_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_special_occasions_creator ON public.special_occasions(creator_id);
CREATE INDEX IF NOT EXISTS idx_special_occasions_date ON public.special_occasions(occasion_date);

-- special_occasion_responses (accepted/declined)
CREATE TABLE IF NOT EXISTS public.special_occasion_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occasion_id UUID NOT NULL REFERENCES public.special_occasions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(occasion_id, user_id)
);

ALTER TABLE public.special_occasion_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read responses"
  ON public.special_occasion_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.special_occasions so
      WHERE so.id = special_occasion_responses.occasion_id
      AND (so.creator_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.special_occasion_participants WHERE occasion_id = so.id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Participants can respond"
  ON public.special_occasion_responses FOR ALL
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.special_occasion_participants WHERE occasion_id = special_occasion_responses.occasion_id AND user_id = auth.uid())
  )
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sor_occasion ON public.special_occasion_responses(occasion_id);
CREATE INDEX IF NOT EXISTS idx_sor_user ON public.special_occasion_responses(user_id);

-- occasion_meal_options (for special occasion voting)
CREATE TABLE IF NOT EXISTS public.occasion_meal_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occasion_id UUID NOT NULL REFERENCES public.special_occasions(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_data JSONB,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.occasion_meal_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read occasion meals"
  ON public.occasion_meal_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.special_occasions so
      WHERE so.id = occasion_meal_options.occasion_id
      AND (so.creator_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.special_occasion_participants WHERE occasion_id = so.id AND user_id = auth.uid()))
    )
  );

CREATE POLICY "Creators can insert occasion meals"
  ON public.occasion_meal_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.special_occasions
      WHERE id = occasion_meal_options.occasion_id AND creator_id = auth.uid()
    )
  );

-- occasion_meal_votes (one vote per user per option)
CREATE TABLE IF NOT EXISTS public.occasion_meal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occasion_id UUID NOT NULL REFERENCES public.special_occasions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.occasion_meal_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(occasion_id, user_id, option_id)
);

ALTER TABLE public.occasion_meal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can manage occasion votes"
  ON public.occasion_meal_votes FOR ALL
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.special_occasion_participants WHERE occasion_id = occasion_meal_votes.occasion_id AND user_id = auth.uid())
  )
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 9. TERMINATED SESSIONS (optional - for session history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.terminated_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  group_name TEXT,
  top_results JSONB,
  member_responses JSONB,
  terminated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.terminated_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read terminated sessions"
  ON public.terminated_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = terminated_sessions.group_id AND user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================================================
-- 10. REALTIME - Enable for fast live updates
-- Tables: meal_votes (Top 3), daily_responses (Yes/No), special occasions
-- Only adds if not already in publication (safe to re-run)
-- =============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['meal_votes', 'daily_responses', 'dinner_request_responses', 'special_occasions', 'special_occasion_participants', 'special_occasion_responses'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- 11. RPC FUNCTIONS - For optimized batch loading (fast app startup)
-- =============================================================================

-- Get active meal request for a group (used by Voting, Top 3)
CREATE OR REPLACE FUNCTION public.get_active_meal_request(group_uuid UUID)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  recipe_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT mr.id, mr.group_id, mr.recipe_type, mr.status, mr.created_at
  FROM public.meal_requests mr
  WHERE mr.group_id = group_uuid AND mr.status = 'active'
  ORDER BY mr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top voted meals for a request (for Top 3 display)
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
  ORDER BY yes_votes DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fast load: single RPC for app startup (profile + groups + members + responses + meal requests + top meals)
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
              ORDER BY yes_votes DESC
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

-- =============================================================================
-- 12. HELPER: Handle daily_responses upsert (onConflict)
-- The app uses upsert with onConflict('group_id','user_id','response_date')
-- Ensure the unique constraint exists (defined above)
-- =============================================================================
-- No additional setup needed - UNIQUE(group_id, user_id, response_date) handles upsert

-- =============================================================================
-- DONE. Next steps:
-- 1. In Supabase Dashboard: Authentication > Providers > Email: Enable
-- 2. Storage: Create 'avatars' bucket (public) if using profile photos
-- 3. Run this entire file in SQL Editor
-- 4. Restore lib/supabase.js and services from your backup (replace stub implementations)
-- 5. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to app env
-- =============================================================================
