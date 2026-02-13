/**
 * Notification Service - Stub (no Supabase)
 */

export const registerForPushNotifications = async () => ({ success: false, error: 'Demo mode' });

export const savePushTokenToProfile = async () => ({ success: true });

export const initializeNotifications = async () => ({ success: true });

export const addNotificationReceivedListener = () => ({ remove: () => {} });

export const addNotificationResponseListener = () => ({ remove: () => {} });

export const scheduleLocalNotification = async () => ({ success: true });

export const cancelAllNotifications = async () => {};

export const getBadgeCount = async () => 0;

export const setBadgeCount = async () => {};
