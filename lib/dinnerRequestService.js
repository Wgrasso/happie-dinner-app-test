/**
 * Dinner Request Service
 * Real Supabase when USE_REAL_SUPABASE; otherwise stub
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';
import { createMealRequest } from './mealRequestService';

const toAppResponse = (r) => (r === 'yes' ? 'accepted' : r === 'no' ? 'declined' : r);
const toDbResponse = (r) => (r === 'accepted' ? 'yes' : r === 'declined' ? 'no' : r);

export const saveDinnerRequest = async (requestData) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, request: { id: 'mock-req-1' }, message: 'Dinner request saved' };
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const date = requestData.date || new Date().toISOString().split('T')[0];
    const deadlineStr = `${date}T${(requestData.deadlineTime || '12:00:00').slice(0, 8)}:00.000Z`;

    const { data, error } = await supabase
      .from('dinner_requests')
      .insert({
        group_id: requestData.groupId,
        requester_id: user.id,
        request_date: date,
        request_time: requestData.time || null,
        deadline: deadlineStr,
        deadline_time: requestData.deadlineTime || null,
        recipe_type: requestData.recipeType || 'voting',
        status: 'pending',
        occasion_type: requestData.occasionType || null,
        occasion_message: requestData.occasionMessage || null,
      })
      .select('id, group_id, request_date, status, deadline')
      .single();

    if (error) return { success: false, error: error.message };
    return {
      success: true,
      request: { id: data.id, ...data },
      message: 'Dinner request saved',
    };
  } catch (e) {
    return { success: false, error: e?.message || 'saveDinnerRequest failed' };
  }
};

export const getAllDinnerRequests = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, requests: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, requests: [] };

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    const groupIds = (memberships || []).map((m) => m.group_id);
    if (!groupIds.length) return { success: true, requests: [] };

    const { data, error } = await supabase
      .from('dinner_requests')
      .select('id, group_id, requester_id, request_date, request_time, deadline, recipe_type, status, occasion_type, occasion_message')
      .in('group_id', groupIds)
      .eq('status', 'pending')
      .order('deadline', { ascending: true });

    if (error) return { success: false, error: error.message, requests: [] };
    const requests = (data || []).map((r) => ({ ...r, group_id: r.group_id }));
    return { success: true, requests };
  } catch (e) {
    return { success: false, error: e?.message, requests: [] };
  }
};

export const recordUserResponse = async (requestId, response) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Response recorded' };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const dbResponse = toDbResponse(response);
    if (!dbResponse) return { success: false, error: 'Invalid response' };

    const { error } = await supabase
      .from('dinner_request_responses')
      .upsert(
        { request_id: requestId, user_id: user.id, response: dbResponse },
        { onConflict: 'request_id,user_id' }
      );
    if (error) return { success: false, error: error.message };

    return { success: true, message: 'Response recorded' };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const getRequestResponses = async (requestId) => {
  if (!USE_REAL_SUPABASE) return { success: true, responses: {} };
  try {
    const { data, error } = await supabase
      .from('dinner_request_responses')
      .select('user_id, response')
      .eq('request_id', requestId);
    if (error) return { success: false, responses: {} };
    const responses = {};
    (data || []).forEach((r) => {
      responses[r.user_id] = toAppResponse(r.response);
    });
    return { success: true, responses };
  } catch (e) {
    return { success: false, responses: {} };
  }
};

export const createMealFromRequest = async (dinnerRequestId) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Meal created', mealRequest: { id: 'mock-req-1' } };
  try {
    const { data: dr } = await supabase
      .from('dinner_requests')
      .select('group_id')
      .eq('id', dinnerRequestId)
      .eq('status', 'pending')
      .single();
    if (!dr) return { success: false, error: 'Dinner request not found or already completed' };

    const createResult = await createMealRequest(dr.group_id, 10);
    if (!createResult.success) return { success: false, error: createResult.error };
    return {
      success: true,
      message: 'Meal created',
      mealRequest: createResult.request,
    };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

export const getGroupMemberResponses = async (groupId) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, hasActiveRequest: false, activeRequest: null, memberResponses: [], summary: null };
  }
  try {
    const { data: requests } = await supabase
      .from('dinner_requests')
      .select('id, group_id, requester_id, request_date, request_time, deadline, recipe_type, status, occasion_type, occasion_message')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('deadline', { ascending: true })
      .limit(1);

    const dr = requests?.[0];
    if (!dr) {
      return { success: true, hasActiveRequest: false, activeRequest: null, memberResponses: [], summary: null };
    }

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('is_active', true);

    const { data: responses } = await supabase
      .from('dinner_request_responses')
      .select('user_id, response')
      .eq('request_id', dr.id);

    const respMap = new Map((responses || []).map((r) => [r.user_id, toAppResponse(r.response)]));
    const memberResponses = (members || []).map((m) => ({
      userId: m.user_id,
      response: respMap.get(m.user_id) || 'pending',
    }));

    const acceptedCount = memberResponses.filter((r) => r.response === 'accepted').length;
    const totalMembers = memberResponses.length;
    const summary = { responses_count: responses?.length || 0, total_members: totalMembers, accepted_count: acceptedCount };

    return {
      success: true,
      hasActiveRequest: true,
      activeRequest: { id: dr.id, ...dr },
      memberResponses,
      summary,
    };
  } catch (e) {
    return { success: false, hasActiveRequest: false, activeRequest: null, memberResponses: [], summary: null, error: e?.message };
  }
};

export const completeDinnerRequest = async (requestId) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Request completed' };
  try {
    const { error } = await supabase
      .from('dinner_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
    if (error) return { success: false, error: error.message };
    return { success: true, message: 'Request completed' };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};
