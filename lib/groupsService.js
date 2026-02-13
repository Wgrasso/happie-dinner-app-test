/**
 * Groups Service - Create, join, leave, list groups
 * Maps to: groups, group_members
 */

import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';
import { log, debugError } from './debugConfig';

const MOCK_GROUP = {
  id: 'mock-group-1',
  group_id: 'mock-group-1',
  name: 'Demo Group',
  description: 'Your demo group',
  join_code: 'DEMO1234',
  created_by: 'mock-user',
  is_active: true,
  is_main_group: true,
  created_at: new Date().toISOString(),
  group_name: 'Demo Group',
  member_count: 1,
};

export const generateJoinCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const createGroupInSupabase = async (groupName, description = '') => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Connect Supabase to create groups' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in to create a group' };

    const { data: existingGroups } = await supabase
      .from('groups')
      .select('id')
      .eq('created_by', user.id)
      .eq('is_active', true);
    const shouldBeMainGroup = !existingGroups || existingGroups.length === 0;

    let joinCode;
    for (let attempt = 0; attempt < 3; attempt++) {
      joinCode = generateJoinCode();
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name: groupName.trim(), description: (description || '').trim(), join_code: joinCode, created_by: user.id, is_main_group: shouldBeMainGroup }])
        .select('*')
        .single();
      if (!error) {
        await supabase.from('group_members').insert([{ group_id: data.id, user_id: user.id, role: 'admin' }]);
        return { success: true, group: data, message: `Group "${data.name}" created!` };
      }
      if (error.code !== '23505') throw error;
    }
    return { success: false, error: 'Could not generate unique join code' };
  } catch (error) {
    debugError('groups', error);
    return { success: false, error: error.message || 'Failed to create group' };
  }
};

export const updateMainGroupAfterDeletion = async () => {};

export const joinGroupByCode = async (joinCode) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Connect Supabase to join groups' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in to join a group' };

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('join_code', (joinCode || '').toUpperCase())
      .eq('is_active', true)
      .single();
    if (groupError || !group) return { success: false, error: 'Group not found. Check the join code.' };

    const { data: existing } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle();
    if (existing) return { success: false, error: 'You are already a member of this group' };

    const { data: newMember, error: joinError } = await supabase
      .from('group_members')
      .insert([{ group_id: group.id, user_id: user.id, role: 'member' }])
      .select('*')
      .single();
    if (joinError) throw joinError;
    return { success: true, group, member: newMember, message: `Joined "${group.name}"!` };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to join group' };
  }
};

export const getUserGroups = async () => {
  if (!USE_REAL_SUPABASE) return { success: true, groups: [MOCK_GROUP] };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in to view groups' };

    const { data: memberRows, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    if (memberError) throw memberError;
    if (!memberRows?.length) return { success: true, groups: [] };

    const groupIds = memberRows.map((m) => m.group_id);
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, join_code, created_by, is_active, created_at, is_main_group')
      .in('id', groupIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (groupsError) throw groupsError;

    const withCounts = await Promise.all(
      (groups || []).map(async (g) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id)
          .eq('is_active', true);
        return {
          ...g,
          group_id: g.id,
          group_name: g.name,
          member_count: count ?? 0,
        };
      })
    );
    return { success: true, groups: withCounts };
  } catch (error) {
    debugError('groups', error);
    return { success: false, error: error.message || 'Failed to load groups' };
  }
};

export const leaveGroup = async (groupId) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Left group' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in' };

    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    if (error) throw error;

    const { data: remaining } = await supabase.from('group_members').select('id').eq('group_id', groupId).eq('is_active', true).limit(1);
    if (!remaining?.length) {
      await supabase.from('groups').delete().eq('id', groupId);
      return { success: true, message: 'Left group. Group was deleted.', groupDeleted: true };
    }
    return { success: true, message: 'Left group', groupDeleted: false };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to leave group' };
  }
};

export const deleteGroup = async (groupId) => {
  if (!USE_REAL_SUPABASE) return { success: false, error: 'Connect Supabase to delete groups' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'You must be signed in' };

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, created_by')
      .eq('id', groupId)
      .eq('is_active', true)
      .single();
    if (groupError || !group) return { success: false, error: 'Group not found' };
    if (group.created_by !== user.id) return { success: false, error: 'You can only delete groups you created' };

    await supabase.from('group_members').delete().eq('group_id', groupId);
    await supabase.from('groups').update({ is_active: false }).eq('id', groupId);
    return { success: true, message: 'Group deleted' };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to delete group' };
  }
};

export const getGroupMembers = async (groupId) => {
  if (!USE_REAL_SUPABASE) {
    return {
      success: true,
      members: [{ user_id: 'mock-user', role: 'member', joined_at: new Date().toISOString(), full_name: 'Demo User', user_name: 'Demo User', email: 'demo@happie.app', is_creator: true }],
    };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'Not authenticated', members: [] };

    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .eq('is_active', true);
    if (membersError) throw membersError;
    if (!membersData?.length) return { success: true, members: [] };

    const { data: groupData } = await supabase.from('groups').select('created_by').eq('id', groupId).single();
    const userIds = membersData.map((m) => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name, display_name').in('id', userIds);
    const profilesMap = {};
    (profiles || []).forEach((p) => { profilesMap[p.id] = p; });

    const members = membersData.map((m) => {
      const p = profilesMap[m.user_id] || {};
      const displayName = p.full_name || p.display_name || (m.user_id === user.id ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : null) || `User ${m.user_id?.slice(-4)}`;
      return {
        user_id: m.user_id,
        role: m.role || 'member',
        joined_at: m.joined_at,
        email: p.email || '',
        full_name: displayName,
        user_name: displayName,
        is_creator: groupData?.created_by === m.user_id,
      };
    });
    return { success: true, members };
  } catch (error) {
    debugError('groups', error);
    return { success: false, error: error.message, members: [] };
  }
};

export const setMainGroup = async (groupId) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Main group set' };
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: 'Not signed in' };
    await supabase.from('groups').update({ is_main_group: false }).eq('created_by', user.id).eq('is_main_group', true);
    await supabase.from('groups').update({ is_main_group: true }).eq('id', groupId).eq('created_by', user.id);
    return { success: true, message: 'Main group set' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setFavoriteGroup = async (groupId) => {
  if (!USE_REAL_SUPABASE) return { success: true, message: 'Favorite set' };
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { success: false, error: 'Not signed in' };
    await supabase.auth.updateUser({ data: { favorite_group: groupId } });
    return { success: true, message: 'Favorite set' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFavoriteGroupId = async () => {
  if (!USE_REAL_SUPABASE) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.user_metadata?.favorite_group || null;
  } catch (e) {
    return null;
  }
};
