-- User Recipes: Personal recipes linked to user_id, separate from public recipes table.
-- Users can add their own recipes; these appear in Ideas screen alongside app recipes.
-- Run in Supabase SQL Editor.

-- =============================================================================
-- 1. CREATE user_recipes TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  cooking_time_minutes INT DEFAULT 30,
  cuisine_type TEXT,
  ingredients TEXT[],
  steps TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON public.user_recipes(user_id);

-- =============================================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own recipes
CREATE POLICY "Users can read own recipes"
  ON public.user_recipes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON public.user_recipes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON public.user_recipes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON public.user_recipes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- 3. UPDATED_AT TRIGGER (optional)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.user_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_recipes_updated_at_trigger ON public.user_recipes;
CREATE TRIGGER user_recipes_updated_at_trigger
  BEFORE UPDATE ON public.user_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.user_recipes_updated_at();
