/**
 * User Recipes Service
 * Personal recipes linked to user_id (user_recipes table)
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';

const toRecipeFormat = (r) => ({
  id: r.id,
  name: r.name,
  title: r.name,
  description: r.description || '',
  image: r.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
  thumbnail_url: r.image || 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop',
  cooking_time_minutes: r.cooking_time_minutes || 30,
  readyInMinutes: r.cooking_time_minutes || 30,
  cuisine_type: r.cuisine_type || null,
  dietary: r.cuisine_type ? [r.cuisine_type] : [],
  ingredients: r.ingredients || [],
  steps: r.steps || [],
  instructions: Array.isArray(r.steps) ? r.steps.join('\n') : (r.steps || ''),
  isUserRecipe: true,
  user_id: r.user_id,
});

export const getMyRecipes = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, recipes: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, recipes: [] };

    const { data, error } = await supabase
      .from('user_recipes')
      .select('id, user_id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, recipes: [] };
    return { success: true, recipes: (data || []).map(toRecipeFormat) };
  } catch (e) {
    return { success: false, error: e?.message, recipes: [] };
  }
};

export const addUserRecipe = async (recipe) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = {
      user_id: user.id,
      name: recipe.name?.trim() || 'Recept',
      description: recipe.description?.trim() || null,
      image: recipe.image?.trim() || null,
      cooking_time_minutes: parseInt(recipe.cooking_time_minutes, 10) || 30,
      cuisine_type: recipe.cuisine_type?.trim() || null,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : (recipe.steps ? [recipe.steps] : []),
    };

    const { data, error } = await supabase
      .from('user_recipes')
      .insert(row)
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, user_id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, recipe: toRecipeFormat(data) };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const updateUserRecipe = async (id, recipe) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = {
      name: recipe.name?.trim() || 'Recept',
      description: recipe.description?.trim() || null,
      image: recipe.image?.trim() || null,
      cooking_time_minutes: parseInt(recipe.cooking_time_minutes, 10) || 30,
      cuisine_type: recipe.cuisine_type?.trim() || null,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : (recipe.steps ? [recipe.steps] : []),
    };

    const { data, error } = await supabase
      .from('user_recipes')
      .update(row)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, user_id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, recipe: toRecipeFormat(data) };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const deleteUserRecipe = async (id) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Demo mode' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('user_recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};
