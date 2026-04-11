/**
 * Recipes Service
 * Real Supabase when connected; otherwise mock
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';

const MOCK_RECIPES = [
  {
    id: 'r1',
    name: 'Pasta Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    cooking_time_minutes: 25,
    description: 'Classic Italian pasta with creamy egg sauce',
    cuisine_type: 'Italian',
  },
  {
    id: 'r2',
    name: 'Grilled Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    cooking_time_minutes: 20,
    description: 'Fresh salmon with herbs and lemon',
    cuisine_type: 'Seafood',
  },
  {
    id: 'r3',
    name: 'Vegetable Stir Fry',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    cooking_time_minutes: 15,
    description: 'Colorful vegetables in a savory sauce',
    cuisine_type: 'Asian',
  },
];

export const getRandomRecipes = async (limit = 20) => {
  if (!USE_REAL_SUPABASE) return MOCK_RECIPES.slice(0, limit);
  try {
    const fetchCount = Math.max(limit, 50);
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links)')
      .eq('visibility', 'public')
      .limit(fetchCount);
    if (error || !data?.length) return [];
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((r) => ({
      ...r,
      thumbnail_url: r.image,
      chef: r.chef_profiles || null,
    }));
  } catch (e) {
    return [];
  }
};

export const getRandomRecipesExcluding = async (limit = 10, excludeIds = []) => {
  if (!USE_REAL_SUPABASE) return MOCK_RECIPES.filter((r) => !excludeIds.includes(r.id)).slice(0, limit);
  try {
    const fetchCount = Math.max(limit, 50);
    let query = supabase
      .from('recipes')
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links)')
      .eq('visibility', 'public')
      .limit(fetchCount);
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    const { data, error } = await query;
    if (error || !data?.length) return [];
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((r) => ({
      ...r,
      thumbnail_url: r.image,
      chef: r.chef_profiles || null,
    }));
  } catch (e) {
    return [];
  }
};

export const getAllRecipes = async (offset = 0, limit = 20) => {
  if (!USE_REAL_SUPABASE) {
    return {
      success: true,
      recipes: MOCK_RECIPES.slice(offset, offset + limit),
      hasMore: false,
    };
  }
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links)')
      .eq('visibility', 'public')
      .range(offset, offset + limit - 1);
    if (error) return { success: false, recipes: [], hasMore: false };
    const recipes = (data || []).map((r) => ({ ...r, thumbnail_url: r.image, chef: r.chef_profiles || null }));
    return { success: true, recipes, hasMore: recipes.length >= limit };
  } catch (e) {
    return { success: false, recipes: [], hasMore: false };
  }
};


export const addRecipe = async () => ({ success: true, recipe: MOCK_RECIPES[0] });

export const updateRecipe = async () => ({ success: true });

export const deleteRecipe = async () => ({ success: true });

export const getRecipeById = async () => MOCK_RECIPES[0] || null;

export const searchRecipes = async () => MOCK_RECIPES;

/**
 * Add a recipe as a chef (goes into public recipes table)
 */
export const addChefRecipe = async (chefId, recipe) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const row = {
      chef_id: chefId,
      name: recipe.name?.trim() || 'Recipe',
      description: recipe.description?.trim() || null,
      image: recipe.image || null,
      cooking_time_minutes: parseInt(recipe.cooking_time_minutes, 10) || 30,
      cuisine_type: recipe.cuisine_type?.trim() || null,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : (recipe.steps ? [recipe.steps] : []),
      visibility: recipe.visibility || 'public',
    };
    if (recipe.estimated_cost) {
      row.estimated_cost = parseFloat(recipe.estimated_cost);
    }
    if (recipe.default_servings) {
      row.default_servings = parseInt(recipe.default_servings, 10);
    }

    const { data, error } = await supabase
      .from('recipes')
      .insert(row)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, recipe: data };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Get all recipes for the current chef (all visibilities — for chef's own dashboard)
 */
export const getMyChefRecipes = async (chefId) => {
  if (!USE_REAL_SUPABASE) return { success: true, recipes: [] };
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, recipes: [] };
    const recipes = (data || []).map((r) => ({ ...r, thumbnail_url: r.image }));
    return { success: true, recipes };
  } catch (e) {
    return { success: false, error: e?.message, recipes: [] };
  }
};

/**
 * Update a chef's own recipe
 */
export const updateChefRecipe = async (recipeId, chefId, updates) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const row = {};
    if (updates.name !== undefined) row.name = updates.name?.trim();
    if (updates.description !== undefined) row.description = updates.description?.trim() || null;
    if (updates.image !== undefined) row.image = updates.image;
    if (updates.cooking_time_minutes !== undefined) row.cooking_time_minutes = parseInt(updates.cooking_time_minutes, 10) || 30;
    if (updates.cuisine_type !== undefined) row.cuisine_type = updates.cuisine_type?.trim() || null;
    if (updates.ingredients !== undefined) row.ingredients = Array.isArray(updates.ingredients) ? updates.ingredients : [];
    if (updates.steps !== undefined) row.steps = Array.isArray(updates.steps) ? updates.steps : [];
    if (updates.visibility !== undefined) row.visibility = updates.visibility;
    if (updates.estimated_cost !== undefined) row.estimated_cost = updates.estimated_cost ? parseFloat(updates.estimated_cost) : null;
    if (updates.default_servings !== undefined) row.default_servings = parseInt(updates.default_servings, 10) || 4;

    const { data, error } = await supabase
      .from('recipes')
      .update(row)
      .eq('id', recipeId)
      .eq('chef_id', chefId)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, recipe: data };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Delete a chef's own recipe
 */
export const deleteChefRecipe = async (recipeId, chefId) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('chef_id', chefId);

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Share a recipe with specific groups (insert into recipe_group_shares)
 */
/**
 * Normalize a recipe object into the JSONB snapshot shape stored in
 * recipe_group_shares.recipe_data. Group copies read from this snapshot so
 * they're independent from later edits/deletion of the source recipe.
 */
const buildRecipeSnapshot = (recipe) => {
  if (!recipe || !recipe.id) return null;
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : (typeof recipe.instructions === 'string' && recipe.instructions.trim().length > 0
      ? recipe.instructions.split('\n').map((s) => s.trim()).filter(Boolean)
      : []);
  return {
    id: String(recipe.id),
    name: recipe.name || recipe.title || '',
    title: recipe.title || recipe.name || '',
    description: recipe.description || '',
    image: recipe.image || recipe.thumbnail_url || null,
    thumbnail_url: recipe.thumbnail_url || recipe.image || null,
    cooking_time_minutes: recipe.cooking_time_minutes ?? recipe.readyInMinutes ?? null,
    cuisine_type: recipe.cuisine_type || null,
    dietary: Array.isArray(recipe.dietary) ? recipe.dietary : [],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps,
    instructions: typeof recipe.instructions === 'string' ? recipe.instructions : steps.join('\n'),
    estimated_cost: recipe.estimated_cost ?? null,
    default_servings: recipe.default_servings ?? null,
    chef: recipe.chef || recipe.chef_profiles || null,
    chef_id: recipe.chef_id ?? null,
  };
};

/**
 * Save (or re-save) a recipe into one or more groups.
 *
 * IMPORTANT: This is a diff-based operation — shares that already exist are
 * NOT overwritten. That way a group's saved copy stays frozen at the moment
 * the user first saved it, even if the source recipe is later edited or
 * deleted. Only the rows the caller explicitly wants removed or added are
 * touched.
 *
 * Signature accepts either a full recipe object (preferred) or a bare id for
 * backward compat with older callers. When only an id is passed, no snapshot
 * is written — so please update callers to pass the whole recipe.
 */
export const shareRecipeWithGroups = async (recipeOrId, groupIds, opts = {}) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  const recipe = typeof recipeOrId === 'object' && recipeOrId !== null ? recipeOrId : null;
  const recipeId = recipe ? recipe.id : recipeOrId;
  if (!recipeId) return { success: false, error: 'recipe id required' };
  const targetGroupIds = Array.isArray(groupIds) ? groupIds.filter(Boolean) : [];
  const mode = opts.mode === 'replace' ? 'replace' : 'diff';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Fetch existing shares so we can diff.
    const { data: existingRows, error: fetchErr } = await supabase
      .from('recipe_group_shares')
      .select('id, group_id, recipe_data')
      .eq('recipe_id', recipeId)
      .eq('shared_by', user.id);

    if (fetchErr) return { success: false, error: fetchErr.message };

    const existingGroupIds = (existingRows || []).map((r) => r.group_id);
    const toAdd = targetGroupIds.filter((gid) => !existingGroupIds.includes(gid));
    const toRemove = mode === 'replace'
      ? existingGroupIds.filter((gid) => !targetGroupIds.includes(gid))
      : [];

    if (toRemove.length > 0) {
      const { error: delErr } = await supabase
        .from('recipe_group_shares')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('shared_by', user.id)
        .in('group_id', toRemove);
      if (delErr) return { success: false, error: delErr.message };
    }

    if (toAdd.length > 0) {
      const snapshot = buildRecipeSnapshot(recipe);
      const rows = toAdd.map((gid) => ({
        recipe_id: recipeId,
        group_id: gid,
        shared_by: user.id,
        recipe_data: snapshot,
      }));
      const { error: insErr } = await supabase
        .from('recipe_group_shares')
        .insert(rows);
      if (insErr) return { success: false, error: insErr.message };
    }

    return { success: true, added: toAdd.length, removed: toRemove.length };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Remove a single recipe from a single group. Only works for shares the
 * caller created themselves (enforced via RLS + shared_by filter).
 */
export const removeRecipeFromGroup = async (recipeId, groupId) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  if (!recipeId || !groupId) return { success: false, error: 'recipeId and groupId required' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Delete rows matching either the real recipe_id OR a snapshot id (for
    // orphaned rows whose source recipe has been deleted).
    const { error } = await supabase
      .from('recipe_group_shares')
      .delete()
      .eq('group_id', groupId)
      .or(`recipe_id.eq.${recipeId},recipe_data->>id.eq.${String(recipeId)}`);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Get shares for a recipe (which groups it's shared with).
 *
 * Matches on either the real recipe_id (when the source recipe still exists)
 * or on the snapshot id (recipe_data->>id) — so orphaned snapshots still
 * count as "this recipe is in this group".
 */
export const getRecipeShares = async (recipeId) => {
  if (!USE_REAL_SUPABASE) return { success: true, groupIds: [] };
  if (!recipeId) return { success: true, groupIds: [] };
  try {
    const { data, error } = await supabase
      .from('recipe_group_shares')
      .select('group_id')
      .or(`recipe_id.eq.${recipeId},recipe_data->>id.eq.${String(recipeId)}`);

    if (error) return { success: false, groupIds: [] };
    const unique = Array.from(new Set((data || []).map((r) => r.group_id).filter(Boolean)));
    return { success: true, groupIds: unique };
  } catch (e) {
    return { success: false, groupIds: [] };
  }
};

/**
 * Get all recipes shared with a specific group.
 *
 * Reads the frozen recipe_data snapshot when present (post-migration rows);
 * falls back to joining the live recipes table for any legacy rows without a
 * snapshot. This keeps group-saved recipes independent from later edits or
 * deletion of the original.
 */
export const getGroupRecipes = async (groupId) => {
  if (!USE_REAL_SUPABASE) return { success: true, recipes: [] };
  try {
    const { data, error } = await supabase
      .from('recipe_group_shares')
      .select('id, recipe_id, shared_by, created_at, recipe_data, recipes(id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links))')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, recipes: [] };

    const recipes = (data || [])
      .map((row) => {
        // Prefer the frozen snapshot if it exists; fall back to the joined
        // live recipe so legacy rows keep rendering until backfill catches up.
        if (row.recipe_data && typeof row.recipe_data === 'object') {
          const snap = row.recipe_data;
          return {
            ...snap,
            id: snap.id || row.recipe_id,
            share_id: row.id,
            share_group_id: groupId,
            shared_by: row.shared_by,
            thumbnail_url: snap.thumbnail_url || snap.image,
            chef: snap.chef || null,
          };
        }
        if (row.recipes) {
          const r = row.recipes;
          return {
            ...r,
            share_id: row.id,
            share_group_id: groupId,
            shared_by: row.shared_by,
            thumbnail_url: r.image,
            chef: r.chef_profiles || null,
          };
        }
        return null;
      })
      .filter(Boolean);

    return { success: true, recipes };
  } catch (e) {
    return { success: false, error: e?.message, recipes: [] };
  }
};

/**
 * Get recipes for voting: public recipes + recipes shared with this group
 */
export const getRecipesForVoting = async (groupId, limit = 20) => {
  if (!USE_REAL_SUPABASE) return MOCK_RECIPES.slice(0, limit);
  try {
    // 1. Get group-shared recipe IDs
    const { data: shares } = await supabase
      .from('recipe_group_shares')
      .select('recipe_id')
      .eq('group_id', groupId);
    const sharedIds = (shares || []).map((s) => s.recipe_id);

    // 2. Fetch public recipes
    const fetchCount = Math.max(limit, 50);
    const { data: publicRecipes } = await supabase
      .from('recipes')
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links)')
      .eq('visibility', 'public')
      .limit(fetchCount);

    // 3. Fetch group-shared recipes (if any)
    let groupRecipes = [];
    if (sharedIds.length > 0) {
      const { data: shared } = await supabase
        .from('recipes')
        .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id, visibility, estimated_cost, chef_profiles(id, name, tag, profile_image, description, links)')
        .in('id', sharedIds);
      groupRecipes = shared || [];
    }

    // 4. Merge and deduplicate
    const seenIds = new Set();
    const allRecipes = [];
    for (const r of [...(groupRecipes), ...(publicRecipes || [])]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        allRecipes.push(r);
      }
    }

    // 5. Shuffle and limit
    const shuffled = [...allRecipes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((r) => ({
      ...r,
      thumbnail_url: r.image,
      chef: r.chef_profiles || null,
    }));
  } catch (e) {
    return [];
  }
};
