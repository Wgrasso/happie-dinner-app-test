/**
 * Notification Service - Expo Push Notifications via Supabase
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { USE_REAL_SUPABASE } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    return { success: false, error: 'Physical device required for push notifications' };
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { success: false, error: 'Permission not granted' };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'ef1bab23-7ed4-42f7-bcea-56df83d45919',
    });

    return { success: true, token: tokenData.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const savePushTokenToProfile = async (token) => {
  if (!USE_REAL_SUPABASE || !token) return { success: false };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const initializeNotifications = async () => {
  const result = await registerForPushNotifications();
  if (result.success && result.token) {
    await savePushTokenToProfile(result.token);
  }
  return result;
};

export const addNotificationReceivedListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler);
};

export const addNotificationResponseListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

export const scheduleLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Send push notifications to a list of Expo push tokens.
 * Uses the Expo push API directly from the client.
 */
export const sendPushNotifications = async (tokens, title, body, data = {}) => {
  const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));
  if (validTokens.length === 0) return { success: true, sent: 0 };

  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true, sent: validTokens.length };
  } catch (error) {
    console.error('Push notification send failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to all participants of a special occasion (except the creator).
 */
export const notifyOccasionParticipants = async (occasionId, creatorId, title, body) => {
  if (!USE_REAL_SUPABASE) return { success: true, sent: 0 };

  try {
    const { data: participants, error } = await supabase
      .from('special_occasion_participants')
      .select('user_id')
      .eq('occasion_id', occasionId)
      .neq('user_id', creatorId);

    if (error || !participants?.length) return { success: true, sent: 0 };

    const userIds = participants.map(p => p.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (!profiles?.length) return { success: true, sent: 0 };

    const tokens = profiles.map(p => p.push_token).filter(Boolean);
    return await sendPushNotifications(tokens, title, body, {
      type: 'occasion_invite',
      occasionId,
    });
  } catch (error) {
    console.error('notifyOccasionParticipants error:', error.message);
    return { success: false, error: error.message };
  }
};
