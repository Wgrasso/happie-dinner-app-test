/**
 * Chef Service
 * Fetch and manage chef profiles from Supabase
 */

import { supabase, USE_REAL_SUPABASE } from './supabase';

/**
 * Helper: get chef profiles by type that have at least one public recipe
 */
const getProfilesByType = async (profileType) => {
  if (!USE_REAL_SUPABASE) return [];
  try {
    // Step 1: Get all chef_ids that have a public recipe
    const { data: publicRecipes } = await supabase
      .from('recipes')
      .select('chef_id')
      .eq('visibility', 'public')
      .not('chef_id', 'is', null);

    if (!publicRecipes || publicRecipes.length === 0) return [];

    const chefIdsWithPublic = [...new Set(publicRecipes.map((r) => r.chef_id))];

    // Step 2: Get profiles matching type and having public recipes
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('profile_type', profileType)
      .in('id', chefIdsWithPublic)
      .order('name', { ascending: true });

    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
};

/**
 * Get all chefs (profile_type = 'chef') that have at least one public recipe
 */
export const getAllChefs = async () => {
  const chefs = await getProfilesByType('chef');
  return { success: true, chefs };
};

/**
 * Get all houses (profile_type = 'huis') that have at least one public recipe
 */
export const getAllHouses = async () => {
  const houses = await getProfilesByType('huis');
  return { success: true, houses };
};

export const getChefById = async (chefId) => {
  if (!USE_REAL_SUPABASE) return { success: false, chef: null };
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('id', chefId)
      .maybeSingle();
    if (error) return { success: false, error: error.message, chef: null };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, chef: null, error: e?.message };
  }
};

export const getChefByTag = async (tag) => {
  if (!USE_REAL_SUPABASE) return { success: false, chef: null };
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('tag', tag)
      .maybeSingle();
    if (error) return { success: false, error: error.message, chef: null };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, chef: null, error: e?.message };
  }
};

/**
 * Get the current user's chef profile (if any)
 */
export const getMyChefProfile = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, chef: null };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, chef: null };

    const { data, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return { success: false, error: error.message, chef: null };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, chef: null, error: e?.message };
  }
};

/**
 * Create a chef profile for the current user
 */
export const createChefProfile = async ({ name, tag, description, profile_image, links, profile_type = 'chef' }) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = {
      user_id: user.id,
      name: name?.trim(),
      tag: tag?.trim()?.toLowerCase(),
      description: description?.trim() || null,
      profile_image: profile_image || null,
      links: links || {},
      profile_type,
    };

    const { data, error } = await supabase
      .from('chef_profiles')
      .insert(row)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Update the current user's chef profile
 */
export const updateChefProfile = async (chefId, updates) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = {};
    if (updates.name !== undefined) row.name = updates.name?.trim();
    if (updates.tag !== undefined) row.tag = updates.tag?.trim()?.toLowerCase();
    if (updates.description !== undefined) row.description = updates.description?.trim() || null;
    if (updates.profile_image !== undefined) row.profile_image = updates.profile_image;
    if (updates.links !== undefined) row.links = updates.links;
    if (updates.profile_type !== undefined) row.profile_type = updates.profile_type;

    const { data, error } = await supabase
      .from('chef_profiles')
      .update(row)
      .eq('id', chefId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, chef: data };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Ensure the current user has a chef profile. If one already exists, return
 * it. If not, auto-create a minimal one pre-filled with the user's name so
 * they can save private recipes immediately without an onboarding flow.
 *
 * Users are free to edit the profile later. Public sharing ("Iedereen")
 * is gated by {@link isChefPublicReady} which requires a profile image.
 */
export const ensureChefProfile = async () => {
  if (!USE_REAL_SUPABASE) return { success: false, chef: null };
  try {
    // 1. Already have one?
    const existing = await getMyChefProfile();
    if (existing.success && existing.chef) {
      return { success: true, chef: existing.chef, created: false };
    }

    // 2. Need to create. Pull the user's display name from auth metadata.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated', chef: null };

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split('@')[0] : 'Chef');
    const firstName = fullName.split(' ')[0];

    // Generate a unique tag from the name + short user id suffix.
    const baseTag = firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18);
    const tag = `${baseTag || 'chef'}${user.id.slice(0, 4)}`;

    const result = await createChefProfile({
      name: firstName,
      tag,
      description: null,
      profile_image: null,
      links: {},
      profile_type: 'chef',
    });

    if (!result.success) {
      return { success: false, error: result.error, chef: null };
    }
    return { success: true, chef: result.chef, created: true };
  } catch (e) {
    return { success: false, error: e?.message, chef: null };
  }
};

/**
 * Is this chef profile complete enough to share recipes publicly?
 * Requires: profile_image set AND a non-empty display name.
 * Used to gate the "Iedereen" visibility option in the add-recipe form.
 */
export const isChefPublicReady = (chef) => {
  if (!chef) return false;
  const hasImage = typeof chef.profile_image === 'string' && chef.profile_image.trim().length > 0;
  const hasName = typeof chef.name === 'string' && chef.name.trim().length > 0;
  return hasImage && hasName;
};

/**
 * Check if a tag is available
 */
export const isTagAvailable = async (tag) => {
  if (!USE_REAL_SUPABASE) return true;
  try {
    const normalized = tag?.trim()?.toLowerCase();
    if (!normalized) return false;

    const { data } = await supabase
      .from('chef_profiles')
      .select('id')
      .eq('tag', normalized)
      .maybeSingle();

    return !data;
  } catch (e) {
    return false;
  }
};

/**
 * Delete the current user's chef profile and all their recipes
 */
export const deleteChefProfile = async (chefId) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // 1. Get all recipe IDs for this chef
    const { data: myRecipes } = await supabase
      .from('recipes')
      .select('id')
      .eq('chef_id', chefId);

    const recipeIds = (myRecipes || []).map((r) => r.id);

    // 2. Delete recipe_group_shares (RLS: shared_by = auth.uid())
    if (recipeIds.length > 0) {
      const { error: sharesErr } = await supabase
        .from('recipe_group_shares')
        .delete()
        .in('recipe_id', recipeIds)
        .eq('shared_by', user.id);
      if (sharesErr) {
        console.warn('Failed to delete shares:', sharesErr.message);
      }
    }

    // 3. Delete all recipes one by one (RLS: chef_id must belong to user)
    for (const rid of recipeIds) {
      const { error: recErr } = await supabase
        .from('recipes')
        .delete()
        .eq('id', rid);
      if (recErr) {
        console.warn('Failed to delete recipe:', rid, recErr.message);
      }
    }

    // 4. Delete the chef profile
    const { error } = await supabase
      .from('chef_profiles')
      .delete()
      .eq('id', chefId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};
