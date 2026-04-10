/**
 * Inactive-user reminder logic
 *
 * Fires a local push notification when the current user has not voted
 * for at least 4 days. Gated by a 14-day cooldown so nobody is spammed.
 *
 * This is intentionally client-side (no backend cron). It runs on app
 * launch — when the user opens the app, we check if they deserve a
 * reminder, dispatch a local notification, and log it. If the user
 * never opens the app again, they obviously will not receive the
 * reminder, but that's acceptable for an MVP: the whole point of the
 * reminder is to nudge someone who might be losing the habit, and the
 * trigger fires the moment they tap back in.
 */

import { supabase, USE_REAL_SUPABASE } from './supabase';
import { scheduleLocalNotification } from './notificationService';
import {
  logNotification,
  getLastNotificationOfKind,
} from './notificationLogService';

const INACTIVE_DAYS_THRESHOLD = 4;
const COOLDOWN_DAYS = 14;
const KIND = 'inactive_reminder';

// The copy sent to inactive users. Exposed so the dashboard can render
// it ahead of time ("template preview"), not only after it has been sent.
export const INACTIVE_REMINDER_TEMPLATE = {
  kind: KIND,
  title: 'We missen je! 🍽️',
  body: 'We merken dat je al een paar dagen niet hebt gestemd. Kom lekker terug en kies wat jullie vanavond eten.',
  triggerDescription: `Automatisch verzonden als iemand ${INACTIVE_DAYS_THRESHOLD}+ dagen niet heeft gestemd (max 1× per ${COOLDOWN_DAYS} dagen).`,
};

const daysBetween = (a, b) => {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff / (1000 * 60 * 60 * 24);
};

/**
 * Get the timestamp of the current user's most recent vote.
 * Returns null if we cannot determine it.
 */
const getLastVoteAt = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('meal_votes')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.created_at || null;
  } catch {
    return null;
  }
};

/**
 * Main entry point — call this on app launch (or when the user reaches
 * a main screen). Returns `{ sent: boolean, reason?: string }` so the
 * caller can log/debug if needed.
 */
export const checkAndSendInactiveReminder = async () => {
  if (!USE_REAL_SUPABASE) return { sent: false, reason: 'demo_mode' };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sent: false, reason: 'not_authenticated' };

    // Cooldown check — have we sent one of these in the last 14 days?
    const lastReminder = await getLastNotificationOfKind(user.id, KIND);
    if (lastReminder) {
      const days = daysBetween(lastReminder.created_at, new Date());
      if (days < COOLDOWN_DAYS) {
        return { sent: false, reason: `cooldown_${Math.round(days)}d` };
      }
    }

    // Activity check — when did they last vote?
    const lastVoteAt = await getLastVoteAt(user.id);

    // If we have no vote history at all, fall back to account creation
    // date so brand-new users don't get nagged on day 1.
    const reference = lastVoteAt || user.created_at;
    if (!reference) return { sent: false, reason: 'no_reference_time' };

    const inactiveDays = daysBetween(reference, new Date());
    if (inactiveDays < INACTIVE_DAYS_THRESHOLD) {
      return { sent: false, reason: `active_${Math.round(inactiveDays)}d` };
    }

    // All checks passed — dispatch a local notification and log it.
    try {
      await scheduleLocalNotification(
        INACTIVE_REMINDER_TEMPLATE.title,
        INACTIVE_REMINDER_TEMPLATE.body,
        { kind: KIND, inactiveDays: Math.round(inactiveDays) },
      );
    } catch (e) {
      await logNotification({
        userId: user.id,
        kind: KIND,
        title: INACTIVE_REMINDER_TEMPLATE.title,
        body: INACTIVE_REMINDER_TEMPLATE.body,
        status: 'failed',
        error: e?.message || 'schedule_failed',
      });
      return { sent: false, reason: 'schedule_failed' };
    }

    await logNotification({
      userId: user.id,
      kind: KIND,
      title: INACTIVE_REMINDER_TEMPLATE.title,
      body: INACTIVE_REMINDER_TEMPLATE.body,
      data: { inactiveDays: Math.round(inactiveDays) },
      status: 'sent',
    });

    return { sent: true, inactiveDays: Math.round(inactiveDays) };
  } catch (e) {
    return { sent: false, reason: e?.message || 'exception' };
  }
};
