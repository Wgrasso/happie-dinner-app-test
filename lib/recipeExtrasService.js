/**
 * Recipe Extras Service
 * Fetches default_servings and estimated_cost from recipe_extras table
 */

import { supabase } from './supabase';

// In-memory cache (loaded once per session)
let extrasCache = null;

/**
 * Load all recipe extras into cache
 * Returns a map: { [recipe_name_lowercase]: { default_servings, estimated_cost } }
 */
export async function loadRecipeExtras() {
  if (extrasCache) return extrasCache;

  try {
    const { data, error } = await supabase
      .from('recipe_extras')
      .select('recipe_id, recipe_name, default_servings, estimated_cost');

    if (error) {
      console.warn('[RECIPE-EXTRAS] Error loading:', error.message);
      return {};
    }

    extrasCache = {};
    (data || []).forEach(row => {
      // Index by both recipe_id and lowercase name for flexible lookup
      if (row.recipe_id) {
        extrasCache[row.recipe_id] = {
          default_servings: row.default_servings || 4,
          estimated_cost: row.estimated_cost ? parseFloat(row.estimated_cost) : null,
        };
      }
      if (row.recipe_name) {
        extrasCache[row.recipe_name.toLowerCase()] = {
          default_servings: row.default_servings || 4,
          estimated_cost: row.estimated_cost ? parseFloat(row.estimated_cost) : null,
        };
      }
    });

    return extrasCache;
  } catch (e) {
    console.warn('[RECIPE-EXTRAS] Failed to load:', e);
    return {};
  }
}

/**
 * Get extras for a specific recipe by name or ID
 * Returns { default_servings, estimated_cost } or defaults
 */
export function getRecipeExtras(nameOrId) {
  if (!extrasCache || !nameOrId) {
    return { default_servings: 4, estimated_cost: null };
  }

  // Try exact match by ID first, then by lowercase name
  const match = extrasCache[nameOrId] || extrasCache[nameOrId.toLowerCase()];
  return match || { default_servings: 4, estimated_cost: null };
}

/**
 * Clear the cache (e.g. on logout)
 */
export function clearRecipeExtrasCache() {
  extrasCache = null;
}
