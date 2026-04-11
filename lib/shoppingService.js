/**
 * Shopping Service - Track who is currently shopping for a group
 * Maps to: group_shopping_status (group_id, user_id, shopping_date, is_active)
 */

import { supabase } from './supabase';
import { sendPushNotifications } from './notificationService';

const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Get active shopper for a group today.
 * Returns { shopper: { user_id, user_name, started_at } | null }
 */
export const getActiveShopperToday = async (groupId) => {
  try {
    const today = getTodayDate();
    const { data, error } = await supabase
      .from('group_shopping_status')
      .select('user_id, started_at')
      .eq('group_id', groupId)
      .eq('shopping_date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: true, shopper: null };

    // Get the shopper's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user_id)
      .maybeSingle();

    return {
      success: true,
      shopper: {
        user_id: data.user_id,
        user_name: profile?.full_name || 'Iemand',
        started_at: data.started_at,
      },
    };
  } catch (error) {
    return { success: false, error: error.message, shopper: null };
  }
};

/**
 * Start shopping for a group. Notifies all other group members.
 */
export const startShopping = async (groupId) => {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return { success: false, error: 'Niet ingelogd' };

    const today = getTodayDate();

    // Check if someone else is already shopping
    const { data: existing } = await supabase
      .from('group_shopping_status')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('shopping_date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (existing && existing.user_id !== user.id) {
      return { success: false, error: 'Iemand is al aan het inkopen' };
    }

    // Upsert shopping status
    const { error } = await supabase
      .from('group_shopping_status')
      .upsert({
        group_id: groupId,
        user_id: user.id,
        shopping_date: today,
        is_active: true,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'group_id,shopping_date,user_id',
      });

    if (error) throw error;

    // Get user's name for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.full_name || 'Iemand';

    // Send push to other group members
    notifyGroupMembers(groupId, user.id, 'Boodschappen', `${userName} gaat nu inkopen`);

    return {
      success: true,
      shopper: { user_id: user.id, user_name: userName, started_at: new Date().toISOString() },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Stop shopping (cancel).
 */
export const stopShopping = async (groupId) => {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return { success: false, error: 'Niet ingelogd' };

    const today = getTodayDate();

    const { error } = await supabase
      .from('group_shopping_status')
      .update({ is_active: false })
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('shopping_date', today);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to all group members except the sender.
 */
const notifyGroupMembers = async (groupId, excludeUserId, title, body) => {
  try {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', excludeUserId);

    if (!members?.length) return;

    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (!profiles?.length) return;

    const tokens = profiles.map(p => p.push_token).filter(Boolean);
    await sendPushNotifications(tokens, title, body, {
      type: 'shopping_started',
      groupId,
    });
  } catch (error) {
    // Silent fail - notification is best-effort
  }
};
