-- ============================================
-- Chef Profiles table + link to recipes
-- ============================================

-- 1. Create chef_profiles table
CREATE TABLE IF NOT EXISTS chef_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text NOT NULL UNIQUE,  -- username without @, displayed as @tag
  profile_image text,        -- URL to profile image
  description text,
  links jsonb DEFAULT '{}',  -- e.g. {"instagram": "...", "website": "...", "tiktok": "..."}
  created_at timestamptz DEFAULT now()
);

-- 2. Add chef_id column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS chef_id uuid REFERENCES chef_profiles(id);

-- 3. RLS policies for chef_profiles (public read, admin write)
ALTER TABLE chef_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read chef profiles
CREATE POLICY "Chef profiles are publicly readable"
  ON chef_profiles FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (managed via admin/migrations)
CREATE POLICY "Service role can manage chef profiles"
  ON chef_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Index for fast lookups by tag
CREATE INDEX IF NOT EXISTS idx_chef_profiles_tag ON chef_profiles(tag);

-- 5. Index for fast recipe->chef joins
CREATE INDEX IF NOT EXISTS idx_recipes_chef_id ON recipes(chef_id);
