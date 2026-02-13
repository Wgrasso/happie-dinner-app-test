/**
 * Meal Request Service
 * Real Supabase when USE_REAL_SUPABASE; otherwise returns mock data
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';
import { getRandomRecipes } from './recipesService';

// Fallback when recipes table is empty
const FALLBACK_MEAL_DATA = [
  { name: 'Pasta Carbonara', thumbnail_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', total_time_minutes: 25 },
  { name: 'Grilled Salmon', thumbnail_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', total_time_minutes: 20 },
  { name: 'Vegetable Stir Fry', thumbnail_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', total_time_minutes: 15 },
  { name: 'Chicken Curry', thumbnail_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', total_time_minutes: 35 },
  { name: 'Caesar Salad', thumbnail_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', total_time_minutes: 15 },
  { name: 'Beef Tacos', thumbnail_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', total_time_minutes: 25 },
  { name: 'Mushroom Risotto', thumbnail_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400', total_time_minutes: 40 },
  { name: 'Greek Salad', thumbnail_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', total_time_minutes: 10 },
  { name: 'Fish & Chips', thumbnail_url: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400', total_time_minutes: 30 },
  { name: 'Tomato Soup', thumbnail_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', total_time_minutes: 20 },
];

// Mock for non-Supabase
const MOCK_MEALS = FALLBACK_MEAL_DATA.map((m, i) => ({
  id: `m${i + 1}`,
  meal_data: m,
  ...m,
}));

const toMealOption = (row) => ({
  id: row.id,
  meal_data: row.meal_data || { name: 'Meal', thumbnail_url: '' },
});

export const fetchRandomMealsForGroup = async () => {
  if (!USE_REAL_SUPABASE) return MOCK_MEALS;
  const recipes = await getRandomRecipes(20);
  if (recipes?.length) {
    return recipes.map((r) => ({
      id: r.id,
      meal_data: {
        name: r.name,
        thumbnail_url: r.image || r.thumbnail_url || '',
        total_time_minutes: r.cooking_time_minutes,
      },
    }));
  }
  return FALLBACK_MEAL_DATA.map((m, i) => ({ id: `fallback-${i}`, meal_data: m }));
};

export const createMealRequest = async (groupId, count = 10) => {
  if (!USE_REAL_SUPABASE) {
    return {
      success: true,
      request: { id: 'mock-req-1' },
      mealOptions: MOCK_MEALS.slice(0, Math.min(count, MOCK_MEALS.length)),
    };
  }
  try {
    // Insert meal request
    const { data: request, error: reqErr } = await supabase
      .from('meal_requests')
      .insert({ group_id: groupId, recipe_type: 'voting', status: 'active' })
      .select('id, group_id, recipe_type, status, created_at')
      .single();
    if (reqErr || !request) return { success: false, error: reqErr?.message || 'Failed to create request' };

    const recipes = await getRandomRecipes(count);
    const mealSources = recipes?.length
      ? recipes.map((r) => ({
          recipe_id: r.id,
          meal_data: {
            name: r.name,
            thumbnail_url: r.image || r.thumbnail_url || '',
            total_time_minutes: r.cooking_time_minutes,
          },
        }))
      : FALLBACK_MEAL_DATA.slice(0, count).map((m) => ({ recipe_id: null, meal_data: m }));

    const optionsToInsert = mealSources.map((s, i) => ({
      request_id: request.id,
      recipe_id: s.recipe_id,
      meal_data: s.meal_data,
      display_order: i,
    }));

    const { data: inserted, error: optErr } = await supabase
      .from('meal_options')
      .insert(optionsToInsert)
      .select('id, meal_data');
    if (optErr) return { success: false, error: optErr.message };

    const mealOptions = (inserted || []).map(toMealOption);
    return {
      success: true,
      request: { id: request.id, ...request },
      mealOptions,
    };
  } catch (e) {
    return { success: false, error: e?.message || 'createMealRequest failed' };
  }
};

export const replaceMealRequest = async (groupId, count = 10) => {
  if (!USE_REAL_SUPABASE) {
    return {
      success: true,
      request: { id: 'mock-req-1' },
      mealOptions: MOCK_MEALS.slice(0, Math.min(count, MOCK_MEALS.length)),
    };
  }
  try {
    const { data: completed } = await supabase
      .from('meal_requests')
      .update({ status: 'completed' })
      .eq('group_id', groupId)
      .eq('status', 'active')
      .select();
    return createMealRequest(groupId, count);
  } catch (e) {
    return { success: false, error: e?.message || 'replaceMealRequest failed' };
  }
};

export const getActiveMealRequest = async (groupId) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, hasActiveRequest: false, request: null };
  }
  try {
    console.log('[TOP3-ACTIVE] Calling get_active_meal_request for group:', groupId);
    const { data: rows, error } = await supabase.rpc('get_active_meal_request', { group_uuid: groupId });
    if (error) {
      console.error('[TOP3-ACTIVE] RPC error:', error.message, error.code);
      return { success: false, hasActiveRequest: false, request: null };
    }
    console.log('[TOP3-ACTIVE] Raw result:', JSON.stringify(rows));
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) {
      console.log('[TOP3-ACTIVE] No active request found for group:', groupId);
      return { success: true, hasActiveRequest: false, request: null };
    }

    const { data: options } = await supabase
      .from('meal_options')
      .select('id, meal_data')
      .eq('request_id', row.id)
      .order('display_order');
    const mealOptions = (options || []).map(toMealOption);
    const request = {
      id: row.id,
      group_id: row.group_id,
      recipe_type: row.recipe_type,
      status: row.status,
      created_at: row.created_at,
      mealOptions,
    };
    return { success: true, hasActiveRequest: true, request };
  } catch (e) {
    return { success: false, hasActiveRequest: false, request: null };
  }
};

export const getMealOptions = async (requestId) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, options: MOCK_MEALS };
  }
  try {
    const { data, error } = await supabase
      .from('meal_options')
      .select('id, meal_data')
      .eq('request_id', requestId)
      .order('display_order');
    if (error) return { success: false, error: error.message };
    const options = (data || []).map(toMealOption);
    return { success: true, options };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const getUserVotes = async (requestId) => {
  if (!USE_REAL_SUPABASE) return {};
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};
    const { data } = await supabase
      .from('meal_votes')
      .select('meal_option_id, vote')
      .eq('request_id', requestId)
      .eq('user_id', user.id);
    const map = {};
    (data || []).forEach((v) => { map[v.meal_option_id] = v.vote; });
    return map;
  } catch (e) {
    return {};
  }
};

export const getUserVotingProgress = async (requestId) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, progress: { votedCount: 0, totalCount: 3, nextMealIndex: 0 } };
  }
  try {
    const { data: opts } = await supabase
      .from('meal_options')
      .select('id')
      .eq('request_id', requestId)
      .order('display_order');
    const totalCount = opts?.length || 0;
    if (totalCount === 0) return { success: true, progress: { votedCount: 0, totalCount: 0, nextMealIndex: 0 } };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, progress: { votedCount: 0, totalCount, nextMealIndex: 0 } };

    const { data: votes } = await supabase
      .from('meal_votes')
      .select('meal_option_id')
      .eq('request_id', requestId)
      .eq('user_id', user.id);
    const votedIds = new Set((votes || []).map((v) => v.meal_option_id));
    const votedCount = votedIds.size;
    let nextMealIndex = totalCount; // All voted -> show complete screen
    for (let i = 0; i < opts.length; i++) {
      if (!votedIds.has(opts[i].id)) {
        nextMealIndex = i;
        break;
      }
    }
    return {
      success: true,
      progress: { votedCount, totalCount, nextMealIndex },
    };
  } catch (e) {
    return { success: true, progress: { votedCount: 0, totalCount: 0, nextMealIndex: 0 } };
  }
};

export const voteMealOption = async (requestId, mealOptionId, vote) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    const { error } = await supabase
      .from('meal_votes')
      .upsert(
        { request_id: requestId, meal_option_id: mealOptionId, user_id: user.id, vote },
        { onConflict: 'request_id,user_id,meal_option_id' }
      );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const getVotingResults = async (requestId) => {
  if (!USE_REAL_SUPABASE) return {};
  const res = await getTopVotedMeals(requestId);
  return res?.topMeals ? { success: true, topMeals: res.topMeals } : {};
};

export const getTopVotedMeals = async (requestId) => {
  if (!USE_REAL_SUPABASE) return { success: true, topMeals: [] };
  try {
    console.log('[TOP3-RPC] Calling get_top_voted_meals for request:', requestId);
    const { data: rows, error } = await supabase.rpc('get_top_voted_meals', { request_uuid: requestId });
    if (error) {
      console.error('[TOP3-RPC] RPC error:', error.message, error.code, error.details);
      return { success: false, topMeals: [], error: error.message };
    }
    console.log('[TOP3-RPC] Raw rows:', JSON.stringify(rows));
    const topMeals = (Array.isArray(rows) ? rows : []).map((r) => ({
      meal_option_id: r.meal_option_id,
      yes_votes: r.yes_votes,
      meal_data: r.meal_data || {},
    }));
    console.log('[TOP3-RPC] Mapped topMeals:', topMeals.length, 'meals, votes:', topMeals.map(m => m.yes_votes));
    return { success: true, topMeals };
  } catch (e) {
    console.error('[TOP3-RPC] Exception:', e.message);
    return { success: false, topMeals: [] };
  }
};

export const completeMealRequest = async (requestId) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { error } = await supabase
      .from('meal_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const debugGetActiveRequests = async () => {
  if (!USE_REAL_SUPABASE) return [];
  const { data } = await supabase.from('meal_requests').select('*').eq('status', 'active');
  return data || [];
};

export const debugCompleteAllActiveRequests = async () => {
  if (!USE_REAL_SUPABASE) return { success: true };
  const { error } = await supabase.from('meal_requests').update({ status: 'completed' }).eq('status', 'active');
  return { success: !error };
};

export const debugMealRequestCreation = async () => ({ success: true });
