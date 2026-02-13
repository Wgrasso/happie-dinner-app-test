/**
 * Special Occasion Service
 * Real Supabase when USE_REAL_SUPABASE; otherwise stub
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';
import { getRandomRecipes } from './recipesService';

const FALLBACK_MEAL_DATA = [
  { name: 'Pasta Carbonara', thumbnail_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', total_time_minutes: 25 },
  { name: 'Grilled Salmon', thumbnail_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', total_time_minutes: 20 },
  { name: 'Vegetable Stir Fry', thumbnail_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', total_time_minutes: 15 },
];

const toOccasionMealOption = (row) => ({
  id: row.id,
  meal_data: row.meal_data || { name: 'Meal', thumbnail_url: '' },
});

export const createSpecialOccasion = async (occasionData, participantUserIds = [], groupIds = []) => {
  if (!USE_REAL_SUPABASE) {
    return { success: false, error: 'Demo mode - connect Supabase to create occasions' };
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const date = occasionData.date || new Date().toISOString().split('T')[0];
    const groupIdArray = (groupIds || []).filter(Boolean);

    // Try RPC first (SECURITY DEFINER - bypasses RLS entirely)
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_special_occasion', {
      p_occasion_type: occasionData.occasionType || 'other',
      p_occasion_date: date,
      p_occasion_message: occasionData.occasionMessage || null,
      p_occasion_time: occasionData.time || null,
      p_deadline: occasionData.deadline || null,
      p_group_ids: groupIdArray,
    });

    if (!rpcErr && rpcResult?.success) {
      console.log('[OCCASION] Created via RPC:', rpcResult.occasion_id);
      return {
        success: true,
        occasion: {
          id: rpcResult.occasion_id,
          creator_id: rpcResult.creator_id,
          occasion_type: rpcResult.occasion_type,
          occasion_date: rpcResult.occasion_date,
        },
      };
    }

    // RPC not available - show clear message to run migration
    const rpcMissing = rpcErr?.message?.includes('function') || rpcErr?.code === '42883';
    if (rpcMissing) {
      console.error('[OCCASION] RPC create_special_occasion does not exist. Please run migrations/add-group-to-occasions.sql in Supabase SQL Editor.');
      return { success: false, error: 'Database update nodig. Vraag de beheerder om de migratie uit te voeren.' };
    }

    // RPC exists but returned an error inside the JSON result
    if (rpcResult && !rpcResult.success) {
      console.error('[OCCASION] RPC returned error:', rpcResult.error);
      return { success: false, error: rpcResult.error || 'Failed to create occasion' };
    }

    // Other RPC error - try fallback direct insert
    console.warn('[OCCASION] RPC failed, falling back to direct insert:', rpcErr?.message);

    const deadline = occasionData.deadline || `${date}T23:59:00.000Z`;

    const { data: occasion, error: occErr } = await supabase
      .from('special_occasions')
      .insert({
        creator_id: user.id,
        occasion_type: occasionData.occasionType || 'other',
        occasion_message: occasionData.occasionMessage || null,
        occasion_date: date,
        occasion_time: occasionData.time || null,
        deadline: typeof deadline === 'string' ? deadline : deadline,
        status: 'pending',
        voting_enabled: false,
      })
      .select('id, creator_id, occasion_type, occasion_message, occasion_date, occasion_time, deadline, status')
      .single();

    if (occErr || !occasion) {
      console.error('[OCCASION] Insert failed:', occErr?.message, occErr?.code);
      return { success: false, error: 'Kon moment niet aanmaken. Probeer de app opnieuw te starten.' };
    }

    // Add creator as participant
    await supabase.from('special_occasion_participants')
      .insert({ occasion_id: occasion.id, user_id: user.id });

    return { success: true, occasion };
  } catch (e) {
    console.error('[OCCASION] createSpecialOccasion exception:', e);
    return { success: false, error: e?.message || 'createSpecialOccasion failed' };
  }
};

export const getMySpecialOccasions = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, occasions: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, occasions: [] };

    const today = new Date().toISOString().split('T')[0];
    const { data: partRows } = await supabase
      .from('special_occasion_participants')
      .select('occasion_id')
      .eq('user_id', user.id);
    const partIds = [...new Set((partRows || []).map((r) => r.occasion_id))];
    const orParts = [`creator_id.eq.${user.id}`];
    if (partIds.length) orParts.push(`id.in.(${partIds.join(',')})`);
    const { data, error } = await supabase
      .from('special_occasions')
      .select('id, creator_id, occasion_type, occasion_message, occasion_date, occasion_time, deadline, status, voting_enabled, created_at')
      .or(orParts.join(','));
    if (error) return { success: false, error: error.message, occasions: [] };

    const occasions = (data || []).filter((o) => o.occasion_date >= today);
    const creatorIds = [...new Set(occasions.map((o) => o.creator_id))];
    const { data: profiles } = creatorIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, display_name').in('id', creatorIds)
      : { data: [] };
    const creatorMap = new Map((profiles || []).map((p) => [p.id, p]));

    const withMyResponse = await Promise.all(
      occasions.map(async (o) => {
        const { data: resp } = await supabase
          .from('special_occasion_responses')
          .select('response')
          .eq('occasion_id', o.id)
          .eq('user_id', user.id)
          .single();
        const creator = creatorMap.get(o.creator_id);
        return {
          ...o,
          my_response: resp?.response || null,
          creator_name: creator?.full_name || creator?.display_name || null,
          creator_display_name: creator?.display_name || creator?.full_name || null,
          is_creator: o.creator_id === user.id,
        };
      })
    );
    return { success: true, occasions: withMyResponse };
  } catch (e) {
    return { success: false, error: e?.message, occasions: [] };
  }
};

export const getPastOccasions = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, occasions: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, occasions: [] };
    const today = new Date().toISOString().split('T')[0];
    const { data: partRows } = await supabase
      .from('special_occasion_participants')
      .select('occasion_id')
      .eq('user_id', user.id);
    const partIds = [...new Set((partRows || []).map((r) => r.occasion_id))];
    const orParts = [`creator_id.eq.${user.id}`];
    if (partIds.length) orParts.push(`id.in.(${partIds.join(',')})`);
    const { data } = await supabase
      .from('special_occasions')
      .select('id, creator_id, occasion_type, occasion_message, occasion_date, occasion_time, deadline, status, created_at')
      .or(orParts.join(','))
      .lt('occasion_date', today)
      .order('occasion_date', { ascending: false })
      .limit(20);
    const occasions = data || [];
    const creatorIds = [...new Set(occasions.map((o) => o.creator_id))];
    const { data: profiles } = creatorIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, display_name').in('id', creatorIds)
      : { data: [] };
    const creatorMap = new Map((profiles || []).map((p) => [p.id, p]));

    const withMyResponse = await Promise.all(
      occasions.map(async (o) => {
        const { data: resp } = await supabase
          .from('special_occasion_responses')
          .select('response')
          .eq('occasion_id', o.id)
          .eq('user_id', user.id)
          .single();
        const creator = creatorMap.get(o.creator_id);
        return {
          ...o,
          my_response: resp?.response || null,
          creator_name: creator?.full_name || creator?.display_name || null,
          is_creator: o.creator_id === user.id,
        };
      })
    );
    return { success: true, occasions: withMyResponse };
  } catch (e) {
    return { success: true, occasions: [] };
  }
};

export const deleteOldOccasions = async () => ({ success: true });

export const getOccasionParticipants = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: true, participants: [] };
  try {
    const { data: participants } = await supabase
      .from('special_occasion_participants')
      .select('user_id')
      .eq('occasion_id', occasionId);
    if (!participants?.length) return { success: true, participants: [] };

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, email')
      .in('id', participants.map((p) => p.user_id));

    const profMap = new Map((profiles || []).map((p) => [p.id, p]));
    const { data: responses } = await supabase
      .from('special_occasion_responses')
      .select('user_id, response')
      .eq('occasion_id', occasionId);

    const respMap = new Map((responses || []).map((r) => [r.user_id, r.response]));
    const list = participants.map((p) => {
      const prof = profMap.get(p.user_id) || {};
      return {
        user_id: p.user_id,
        full_name: prof.full_name || prof.display_name || 'Unknown',
        display_name: prof.display_name,
        email: prof.email,
        response: respMap.get(p.user_id) || 'pending',
      };
    });
    return { success: true, participants: list };
  } catch (e) {
    return { success: false, participants: [], error: e?.message };
  }
};

export const respondToOccasion = async (occasionId, response) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!['accepted', 'declined'].includes(response)) return { success: false, error: 'Invalid response' };

    const { error } = await supabase
      .from('special_occasion_responses')
      .upsert(
        { occasion_id: occasionId, user_id: user.id, response },
        { onConflict: 'occasion_id,user_id' }
      );
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const leaveOccasion = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Delete participant row
    const { error } = await supabase
      .from('special_occasion_participants')
      .delete()
      .eq('occasion_id', occasionId)
      .eq('user_id', user.id);

    if (error) {
      console.warn('[OCCASION] Direct delete failed, trying RPC:', error.message);
      // Fallback: use RPC to bypass RLS
      const { error: rpcErr } = await supabase.rpc('leave_special_occasion', {
        p_occasion_id: occasionId,
      });
      if (rpcErr) {
        console.error('[OCCASION] RPC leave failed:', rpcErr.message);
        return { success: false, error: rpcErr.message };
      }
    }

    // Also delete any response the user had
    try {
      await supabase
        .from('special_occasion_responses')
        .delete()
        .eq('occasion_id', occasionId)
        .eq('user_id', user.id);
    } catch (_) {
      // Ignore - response might not exist
    }

    return { success: true };
  } catch (e) {
    console.error('[OCCASION] leaveOccasion exception:', e);
    return { success: false, error: e?.message };
  }
};

export const getAllContacts = async () => ({ success: true, contacts: [] });

export const createOccasionMealOptions = async (occasionId, count = 10) => {
  if (!USE_REAL_SUPABASE) return { success: true, mealOptions: [] };
  try {
    const recipes = await getRandomRecipes(count);
    const mealSources = recipes?.length
      ? recipes.map((r) => ({
          recipe_id: r.id,
          meal_data: { name: r.name, thumbnail_url: r.image || r.thumbnail_url || '', total_time_minutes: r.cooking_time_minutes },
        }))
      : FALLBACK_MEAL_DATA.slice(0, count).map((m) => ({ recipe_id: null, meal_data: m }));

    const rows = mealSources.map((s, i) => ({
      occasion_id: occasionId,
      recipe_id: s.recipe_id,
      meal_data: s.meal_data,
      display_order: i,
    }));

    const { data, error } = await supabase
      .from('occasion_meal_options')
      .insert(rows)
      .select('id, meal_data');
    if (error) return { success: false, error: error.message, mealOptions: [] };
    return { success: true, mealOptions: (data || []).map(toOccasionMealOption) };
  } catch (e) {
    return { success: false, error: e?.message, mealOptions: [] };
  }
};

export const getOccasionMealOptions = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: false, hasMealOptions: false, mealOptions: [] };
  try {
    const { data, error } = await supabase
      .from('occasion_meal_options')
      .select('id, meal_data')
      .eq('occasion_id', occasionId)
      .order('display_order');
    if (error) return { success: false, hasMealOptions: false, mealOptions: [] };
    const options = (data || []).map(toOccasionMealOption);
    return { success: true, hasMealOptions: options.length > 0, mealOptions: options };
  } catch (e) {
    return { success: false, hasMealOptions: false, mealOptions: [] };
  }
};

export const voteOnOccasionMeal = async (occasionId, optionId, vote = 1) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    const voteVal = typeof vote === 'string' ? (vote === 'yes' ? 1 : 0) : vote;
    const { error } = await supabase
      .from('occasion_meal_votes')
      .upsert(
        { occasion_id: occasionId, option_id: optionId, user_id: user.id, vote: voteVal },
        { onConflict: 'occasion_id,user_id,option_id' }
      );
    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const getOccasionTopMeals = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: true, topMeals: [] };
  try {
    const { data: opts } = await supabase
      .from('occasion_meal_options')
      .select('id, meal_data')
      .eq('occasion_id', occasionId);
    if (!opts?.length) return { success: true, topMeals: [] };

    const { data: votes } = await supabase
      .from('occasion_meal_votes')
      .select('option_id, vote')
      .eq('occasion_id', occasionId);

    const sums = {};
    (votes || []).forEach((v) => {
      sums[v.option_id] = (sums[v.option_id] || 0) + (v.vote || 1);
    });
    const optMap = new Map(opts.map((o) => [o.id, o]));
    const sorted = Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([optId, total]) => ({
        option_id: optId,
        vote_total: total,
        meal_data: optMap.get(optId)?.meal_data || {},
      }));
    return { success: true, topMeals: sorted };
  } catch (e) {
    return { success: false, topMeals: [], error: e?.message };
  }
};

export const getOccasionVotingProgress = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: true, progress: { votedCount: 0, totalCount: 0, nextMealIndex: 0 } };
  try {
    const { data: opts } = await supabase.from('occasion_meal_options').select('id').eq('occasion_id', occasionId).order('display_order');
    const totalCount = opts?.length || 0;
    if (totalCount === 0) return { success: true, progress: { votedCount: 0, totalCount: 0, nextMealIndex: 0 } };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, progress: { votedCount: 0, totalCount, nextMealIndex: 0 } };
    const { data: votes } = await supabase.from('occasion_meal_votes').select('option_id').eq('occasion_id', occasionId).eq('user_id', user.id);
    const votedIds = new Set((votes || []).map((v) => v.option_id));
    const votedCount = votedIds.size;
    let nextMealIndex = totalCount;
    for (let i = 0; i < opts.length; i++) {
      if (!votedIds.has(opts[i].id)) {
        nextMealIndex = i;
        break;
      }
    }
    return { success: true, progress: { votedCount, totalCount, nextMealIndex } };
  } catch (e) {
    return { success: true, progress: { votedCount: 0, totalCount: 0, nextMealIndex: 0 } };
  }
};

export const createOccasionMealRequest = async () => ({ success: true });
export const getOccasionMealRequest = async () => null;
export const updateSpecialOccasion = async () => ({ success: true });
export const deleteSpecialOccasion = async (occasionId) => {
  if (!USE_REAL_SUPABASE) return { success: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Try RPC first (SECURITY DEFINER - guaranteed to work)
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('delete_special_occasion', {
      p_occasion_id: occasionId,
    });

    if (!rpcErr && rpcResult?.success) {
      return { success: true };
    }

    if (rpcErr && (rpcErr.message?.includes('function') || rpcErr.code === '42883')) {
      // RPC doesn't exist - fall back to direct delete
      console.warn('[OCCASION] delete RPC not found, using direct delete');
    } else if (rpcResult && !rpcResult.success) {
      return { success: false, error: rpcResult.error || 'Could not delete occasion' };
    }

    // Fallback: direct delete (CASCADE will remove participants, responses, etc.)
    const { error } = await supabase
      .from('special_occasions')
      .delete()
      .eq('id', occasionId)
      .eq('creator_id', user.id);

    if (error) {
      console.error('[OCCASION] Direct delete failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    console.error('[OCCASION] deleteSpecialOccasion exception:', e);
    return { success: false, error: e?.message };
  }
};

export const cancelSpecialOccasion = async () => ({ success: true });
export const addParticipants = async () => ({ success: true });
export const removeParticipant = async () => ({ success: true });
export const searchUsers = async () => [];
export const getMyOccasionResponse = async () => null;
