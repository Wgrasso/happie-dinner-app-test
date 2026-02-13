/**
 * Batch Data Service - Fast load & preload
 * Uses load_user_dashboard RPC when connected to Supabase
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';
import { getGroupMembers } from './groupsService';
import { getActiveMealRequest, getTopVotedMeals } from './mealRequestService';
import { getGroupResponsesToday } from './dailyResponseService';

const MOCK_GROUP = {
  group_id: 'mock-group-1',
  name: 'Demo Group',
  description: 'Your demo group',
  join_code: 'DEMO1234',
  created_by: 'mock-user',
  is_main_group: true,
  created_at: new Date().toISOString(),
  members: [{ user_id: 'mock-user', full_name: 'Demo User', role: 'admin' }],
  today_responses: {},
  active_meal_request: null,
  top_meals: [],
};

export const loadGroupWithDetails = async (groupId) => {
  if (!USE_REAL_SUPABASE) {
    return { success: true, group: MOCK_GROUP, members: MOCK_GROUP.members, activeMealRequest: null, topMeals: [] };
  }
  try {
    const [groupsRes, membersRes, mealRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).eq('is_active', true).single(),
      getGroupMembers(groupId),
      getActiveMealRequest(groupId),
    ]);
    const group = groupsRes.data;
    if (!group) return { success: false, error: 'Group not found' };
    const members = membersRes.success ? membersRes.members : [];
    const activeReq = mealRes?.hasActiveRequest ? mealRes.request : null;
    let topMeals = [];
    if (activeReq?.id) {
      const topRes = await getTopVotedMeals(activeReq.id);
      topMeals = Array.isArray(topRes) ? topRes : (topRes?.topMeals || topRes?.meals || []);
    }
    return {
      success: true,
      group: { ...group, group_id: group.id },
      members,
      activeMealRequest: activeReq,
      topMeals,
    };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to load group details' };
  }
};

export const loadUserDashboardData = async () => {
  if (!USE_REAL_SUPABASE) {
    return {
      success: true,
      profile: { id: 'mock-user', full_name: 'Demo User', email: 'demo@happie.app' },
      groups: [MOCK_GROUP],
      dinnerRequests: [],
      specialOccasions: [],
    };
  }
  try {
    const { data, error } = await supabase.rpc('load_user_dashboard');
    if (error) return { success: false, error: error.message };
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!parsed?.success) return { success: false, error: parsed?.error || 'RPC failed' };
    return parsed;
  } catch (e) {
    return { success: false, error: e?.message || 'load_user_dashboard failed' };
  }
};

export const loadAllGroupsOverview = async () => ({ success: true, overview: { 'mock-group-1': { memberCount: 1 } } });

export const preloadGroupsData = async () => ({ success: true });

export const getUserDinnerResponse = async () => null;

export const loadTopVotedMeals = async () => ({ success: true, meals: [] });

export const batchLoadUserResponses = async () => ({});

export const loadGroupsScreenData = async () => ({
  success: true,
  groups: [MOCK_GROUP],
  dinnerRequests: [],
  specialOccasions: [],
});

export const preloadAllGroupData = async (groups) => {
  if (!groups?.length || !USE_REAL_SUPABASE) {
    return { success: true, preloadedData: {}, timestamp: Date.now() };
  }
  try {
    const today = new Date().toISOString().split('T')[0];
    const results = await Promise.all(
      groups.map(async (g) => {
        const gid = g.group_id || g.id;
        const [details, respRes] = await Promise.all([
          loadGroupWithDetails(gid),
          getGroupResponsesToday(gid),
        ]);
        if (!details.success) return null;
        const responsesObj = {};
        (respRes.responses || []).forEach((r) => {
          responsesObj[r.odId] = r.response;
        });
        return {
          groupId: gid,
          data: {
            members: details.members,
            responses: responsesObj,
            topMeals: details.topMeals || [],
            mealRequest: details.activeMealRequest,
            timestamp: Date.now(),
          },
        };
      })
    );
    const preloadedData = {};
    results.forEach((r) => {
      if (r?.groupId && r?.data) preloadedData[r.groupId] = r.data;
    });
    return { success: true, preloadedData, timestamp: Date.now() };
  } catch (e) {
    return { success: false, preloadedData: {}, timestamp: Date.now() };
  }
};
