/**
 * Notification Log Service
 *
 * Tiny CRUD wrapper around the `notification_log` table. Every push or
 * local notification the app dispatches also inserts a row here so we
 * have an auditable timeline of what copy reached which user.
 *
 * See migrations/add-notification-log.sql for the schema + RLS.
 */

import { supabase, USE_REAL_SUPABASE } from './supabase';

/**
 * Record a notification as sent. Called after a local push is scheduled
 * or an Expo push-send call succeeds.
 */
export const logNotification = async ({
  userId,
  kind,
  title,
  body,
  data = {},
  status = 'sent',
  scheduledAt = null,
  error = null,
}) => {
  if (!USE_REAL_SUPABASE) {
    return { success: false, error: 'Demo mode' };
  }
  try {
    const row = {
      user_id: userId,
      kind,
      title,
      body,
      data,
      status,
      scheduled_at: scheduledAt,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      error,
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('notification_log')
      .insert(row)
      .select('*')
      .single();
    if (insertErr) return { success: false, error: insertErr.message };
    return { success: true, log: inserted };
  } catch (e) {
    return { success: false, error: e?.message };
  }
};

/**
 * Fetch the current user's notification history (newest first).
 * Used by the dashboard screen.
 */
export const getMyNotificationLog = async (limit = 100) => {
  if (!USE_REAL_SUPABASE) return { success: true, logs: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, logs: [] };

    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { success: false, error: error.message, logs: [] };
    return { success: true, logs: data || [] };
  } catch (e) {
    return { success: false, error: e?.message, logs: [] };
  }
};

/**
 * Find the most recent notification of a given kind for a user.
 * Used as a cooldown check (e.g. "did we send an inactive_reminder
 * within the last 14 days?").
 */
export const getLastNotificationOfKind = async (userId, kind) => {
  if (!USE_REAL_SUPABASE) return null;
  try {
    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('user_id', userId)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
};
