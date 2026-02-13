/**
 * Wishlist Service
 * Real Supabase when USE_REAL_SUPABASE; otherwise stub
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';

export const getUserWishlist = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, wishlist: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, wishlist: [] };
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, recipe_id, recipe_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message, wishlist: [] };
    const wishlist = (data || []).map((w) => ({
      id: w.recipe_id,
      recipe_id: w.recipe_id,
      recipe_data: w.recipe_data || {},
      ...(w.recipe_data || {}),
    }));
    return { success: true, wishlist };
  } catch (e) {
    return { success: false, wishlist: [], error: e?.message };
  }
};

export const addToWishlist = async (recipe) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    const recipeData = {
      id: recipe.id,
      name: recipe.name,
      image: recipe.image || recipe.thumbnail_url,
      cooking_time_minutes: recipe.cooking_time_minutes,
      description: recipe.description,
      cuisine_type: recipe.cuisine_type,
    };
    const { error } = await supabase
      .from('wishlist')
      .upsert(
        {
          user_id: user.id,
          recipe_id: recipe.id,
          recipe_data: recipeData,
        },
        { onConflict: 'user_id,recipe_id' }
      );
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const removeFromWishlist = async (recipeId) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const isRecipeInWishlist = async (recipeId) => {
  if (!USE_REAL_SUPABASE) return false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch (e) {
    return false;
  }
};

export const clearWishlist = async () => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id);
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};
