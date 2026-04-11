-- Migration: recipe_group_shares → store a frozen snapshot of the recipe
--
-- Reasoning
-- =========
-- Previously recipe_group_shares referenced recipes(id) with ON DELETE CASCADE.
-- When the original chef deleted or edited their recipe, every group that had
-- "saved" that recipe lost it (or silently got the new version).
--
-- New behaviour: a group_saved recipe becomes a self-contained copy.
--  * recipe_data JSONB holds the full recipe as it was at save time.
--  * recipe_id becomes nullable with ON DELETE SET NULL so the row survives
--    deletion of the original.
--
-- Run in Supabase SQL Editor.

-- 1. Add the snapshot column. Nullable first so existing rows keep working.
ALTER TABLE public.recipe_group_shares
  ADD COLUMN IF NOT EXISTS recipe_data JSONB;

-- 2. Drop the old FK (which was ON DELETE CASCADE) and recreate as SET NULL.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.recipe_group_shares'::regclass
    AND contype = 'f'
    AND array_to_string(conkey, ',') = (
      SELECT array_to_string(array_agg(attnum ORDER BY attnum), ',')
      FROM pg_attribute
      WHERE attrelid = 'public.recipe_group_shares'::regclass
        AND attname = 'recipe_id'
    );

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.recipe_group_shares DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- 3. Make recipe_id nullable so we can keep orphaned snapshots.
ALTER TABLE public.recipe_group_shares
  ALTER COLUMN recipe_id DROP NOT NULL;

-- 4. Recreate the FK with ON DELETE SET NULL.
ALTER TABLE public.recipe_group_shares
  ADD CONSTRAINT recipe_group_shares_recipe_id_fkey
  FOREIGN KEY (recipe_id)
  REFERENCES public.recipes(id)
  ON DELETE SET NULL;

-- 5. Backfill recipe_data for existing rows from the joined recipes table so
--    the frontend can stop doing the join immediately.
UPDATE public.recipe_group_shares rgs
SET recipe_data = jsonb_build_object(
  'id', r.id,
  'name', r.name,
  'description', r.description,
  'image', r.image,
  'thumbnail_url', r.image,
  'cooking_time_minutes', r.cooking_time_minutes,
  'cuisine_type', r.cuisine_type,
  'ingredients', to_jsonb(r.ingredients),
  'steps', to_jsonb(r.steps),
  'estimated_cost', r.estimated_cost,
  'default_servings', r.default_servings
)
FROM public.recipes r
WHERE rgs.recipe_id = r.id
  AND rgs.recipe_data IS NULL;

-- 6. For robustness, also allow rows where recipe_id has gone NULL but
--    recipe_data is still present — nothing to do, they're valid as-is.

-- 7. Keep the unique constraint on (recipe_id, group_id) usable. Because
--    recipe_id may now be NULL, we switch to a partial unique index that
--    applies only when recipe_id is non-null. Pure-snapshot rows use
--    recipe_data->>'id' as logical identity; enforce it with another partial
--    index so you still can't save the same imported recipe twice.
DO $$
DECLARE
  uq_name TEXT;
BEGIN
  SELECT conname INTO uq_name
  FROM pg_constraint
  WHERE conrelid = 'public.recipe_group_shares'::regclass
    AND contype = 'u'
    AND array_to_string(conkey, ',') = (
      SELECT array_to_string(array_agg(attnum ORDER BY attnum), ',')
      FROM pg_attribute
      WHERE attrelid = 'public.recipe_group_shares'::regclass
        AND attname IN ('recipe_id', 'group_id')
    );

  IF uq_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.recipe_group_shares DROP CONSTRAINT %I', uq_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS recipe_group_shares_recipe_group_uq
  ON public.recipe_group_shares (recipe_id, group_id)
  WHERE recipe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS recipe_group_shares_data_group_uq
  ON public.recipe_group_shares ((recipe_data->>'id'), group_id)
  WHERE recipe_id IS NULL AND recipe_data IS NOT NULL;
