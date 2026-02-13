/**
 * Daily Response Service - Yes/No dinner today per group
 * Maps to: daily_responses (group_id, user_id, response_date, response)
 */

import { supabase } from './supabase';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const getGroupResponsesToday = async (groupId) => {
  try {
    const today = getTodayDate();
    const { data, error } = await supabase
      .from('daily_responses')
      .select('id, user_id, response, created_at')
      .eq('group_id', groupId)
      .eq('response_date', today);

    if (error) throw error;

    const memberResponses = (data || []).map((r) => ({
      odId: r.user_id,
      userName: null,
      response: r.response,
      respondedAt: r.created_at,
    }));

    return {
      success: true,
      responses: memberResponses,
      date: today,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to get responses',
    };
  }
};

export const setMyResponseToday = async (groupId, response) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'You must be signed in' };
    }

    const today = getTodayDate();
    const { error } = await supabase
      .from('daily_responses')
      .upsert(
        {
          group_id: groupId,
          user_id: user.id,
          response_date: today,
          response,
        },
        { onConflict: 'group_id,user_id,response_date' }
      );

    if (error) throw error;
    return { success: true, message: 'Response saved' };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to save response',
    };
  }
};

export const getMyResponseToday = async (groupId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, response: null };

    const today = getTodayDate();
    const { data, error } = await supabase
      .from('daily_responses')
      .select('response')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('response_date', today)
      .maybeSingle();

    if (error) throw error;
    return {
      success: true,
      response: data?.response ?? null,
      date: today,
    };
  } catch (error) {
    return { success: false, response: null };
  }
};

export const getResponseCounts = async (groupId) => {
  try {
    const today = getTodayDate();
    const { data, error } = await supabase
      .from('daily_responses')
      .select('response')
      .eq('group_id', groupId)
      .eq('response_date', today);

    if (error) throw error;

    const yesCount = (data || []).filter((r) => r.response === 'yes').length;
    const noCount = (data || []).filter((r) => r.response === 'no').length;

    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_active', true);

    return {
      success: true,
      yesCount,
      noCount,
      totalMembers: count ?? 0,
    };
  } catch (error) {
    return { success: false, yesCount: 0, noCount: 0, totalMembers: 0 };
  }
};
