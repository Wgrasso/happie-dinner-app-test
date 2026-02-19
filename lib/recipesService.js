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
      .select('id, name, description, image, cooking_time_minutes, cuisine_type')
      .limit(fetchCount);
    if (error || !data?.length) return [];
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((r) => ({
      ...r,
      thumbnail_url: r.image,
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
      .select('id, name, description, image, cooking_time_minutes, cuisine_type')
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
      .select('id, name, description, image, cooking_time_minutes, cuisine_type')
      .range(offset, offset + limit - 1);
    if (error) return { success: false, recipes: [], hasMore: false };
    const recipes = (data || []).map((r) => ({ ...r, thumbnail_url: r.image }));
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
